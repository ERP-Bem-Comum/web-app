import { CustomFile } from '@/components/files/fileItem'
import { ContractClassification } from '@/enums/contracts'
import {
  Contract,
  ContractPaymentHistory,
  ContractRow,
  IContract,
  ParamsContracts,
} from '@/types/contracts'
import { EditPaymentInfo, Response } from '@/types/global'
import { handleError } from '@/utils/errorHandling'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { HttpStatusCode } from 'axios'
import { queryClient } from 'lib/react-query'
import api from './api'
import { updateFile, uploadFile } from './files'
import { UseDebouncedSearch } from '@/hooks/useDebouncedSearch'
import { flattenParams } from '@/utils/flattenParams'
import {
  localDbGetContracts,
  localDbGetContractById,
  localDbSaveContract,
  localDbUpdateContract,
  localDbAddAditive,
  localDbDeleteContract,
  seedLocalDb,
  type LocalContract,
} from '@/mocks/localDb'

/* ═════════════════════════════════════
   HELPERS
   ═════════════════════════════════════ */

const MAX_SERVICE_ORDER_VALUE = 9999.99

function validateServiceOrderValue(contract: Contract | IContract | Partial<Contract>): void {
  if (
    'classification' in contract &&
    contract.classification === ContractClassification.SERVICE_ORDER &&
    contract.totalValue !== undefined &&
    contract.totalValue !== null &&
    contract.totalValue > MAX_SERVICE_ORDER_VALUE
  ) {
    throw new Error(
      `Para Ordem de Serviço, o valor original máximo permitido é R$ ${MAX_SERVICE_ORDER_VALUE.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
    )
  }
}

function isBackendOfflineError(error: unknown): error is { isBackendOffline: boolean } {
  return typeof error === 'object' && error !== null && 'isBackendOffline' in error
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function enrichContractWithFiles(contract: Contract, files: CustomFile[] | null): Promise<Contract> {
  // Se o contrato já tem signedContractUrl preenchido, não precisa converter
  if (contract.signedContractUrl) return contract
  if (!files || files.length === 0) return contract
  const first = files[0]
  if (first.file) {
    try {
      const base64 = await fileToBase64(first.file)
      return { ...contract, signedContractUrl: base64 }
    } catch (err) {
      console.error('[enrichContractWithFiles] Erro na conversão:', err)
      return contract
    }
  }
  if (first.fileUrl) {
    return { ...contract, signedContractUrl: first.fileUrl }
  }
  return contract
}

/* ═════════════════════════════════════
   SEED (executa uma vez no client)
   ═════════════════════════════════════ */

let seeded = false
function ensureSeeded() {
  if (typeof window !== 'undefined' && !seeded) {
    seedLocalDb()
    seeded = true
  }
}

/* ═════════════════════════════════════
   HOOKS
   ═════════════════════════════════════ */

export const useGetAllFilteredContracts = ({
  paginationParams,
  payableParams,
  search,
}: ParamsContracts) => {
  const searchOnHold = UseDebouncedSearch(search)

  const {
    data,
    isLoading,
    error,
    refetch: refetchFilteredContracts,
    isRefetching,
  } = useQuery({
    queryKey: ['contracts', payableParams, paginationParams, searchOnHold],
    queryFn: () => getAllFilteredContracts({ paginationParams, payableParams, search }),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  })

  return {
    data,
    isLoading,
    isRefetching,
    error,
    refetchFilteredContracts,
  }
}

export const useGetContractById = (id: number | null) => {
  const { data, isLoading } = useQuery({
    queryKey: ['ContractById', id],
    queryFn: () => getContractById(id),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!id,
  })

  return {
    data,
    isLoading,
  }
}

export const useGetHistoryById = (id: number | null, open: boolean) => {
  const { data, isLoading } = useQuery({
    queryKey: ['HistoryById', id],
    queryFn: () => getHistoryById(id),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60,
    enabled: !!id && open,
  })

  return {
    data,
    isLoading,
  }
}

/* ═════════════════════════════════════
   API + LOCAL DB FALLBACK
   ═════════════════════════════════════ */

const getAllFilteredContracts = async (
  params?: ParamsContracts,
): Promise<Response<ContractRow[]>> => {
  try {
    const resp = await api.get('/contracts', {
      params: flattenParams(params),
    })
    return {
      status: resp.status,
      data: resp.data.items,
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    ensureSeeded()
    console.warn('[LOCAL DB] Backend indisponível. Usando contratos locais.')
    const rows = localDbGetContracts()
    return {
      status: 200,
      data: rows as unknown as ContractRow[], // LocalContract → ContractRow (campos compatíveis em runtime)
      error: '',
      meta: {
        itemCount: rows.length,
        totalItems: rows.length,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      },
    }
  }
}

export const createContract = async (
  contract: Contract,
  files: CustomFile[] | null,
): Promise<Response<boolean | string>> => {
  try {
    validateServiceOrderValue(contract)
    const resp = await api.post('/contracts', contract)
    await uploadFile({ contractId: resp.data }, files, 'contracts')
    queryClient.invalidateQueries({ queryKey: ['contracts'] })
    queryClient.refetchQueries({ queryKey: ['contracts'], type: 'all' })

    return {
      status: resp.status,
      data: resp.status === HttpStatusCode.Created,
      error: '',
      meta: null,
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Ordem de Serviço')) {
      return { status: 400, data: false, error: error.message, meta: null }
    }
    ensureSeeded()
    console.warn('[LOCAL DB] Salvando contrato localmente.')
    const enriched = await enrichContractWithFiles(contract, files)
    localDbSaveContract(enriched as unknown as Partial<LocalContract>)
    queryClient.invalidateQueries({ queryKey: ['contracts'] })
    queryClient.refetchQueries({ queryKey: ['contracts'], type: 'all' })
    return {
      status: 201,
      data: true,
      error: '',
      meta: null,
    }
  }
}

export const createAditive = async (
  contract: Contract,
  files: CustomFile[] | null,
  userId: number | undefined,
): Promise<Response<boolean | string>> => {
  try {
    const resp = await api.post('/contracts/aditive', contract)
    await uploadFile({ contractId: resp.data, userId }, files, 'contracts')
    queryClient.invalidateQueries({ queryKey: ['contracts'] })
    queryClient.refetchQueries({ queryKey: ['contracts'], type: 'all' })

    return {
      status: resp.status,
      data: resp.status === HttpStatusCode.Created,
      error: '',
      meta: null,
    }
  } catch (error) {
    ensureSeeded()
    console.warn('[LOCAL DB] Salvando aditivo localmente.')
    const enriched = await enrichContractWithFiles(contract, files)
    if (enriched.parentId) {
      localDbAddAditive(enriched.parentId, enriched as unknown as Partial<LocalContract>)
    }
    queryClient.invalidateQueries({ queryKey: ['contracts'] })
    queryClient.refetchQueries({ queryKey: ['contracts'], type: 'all' })
    return {
      status: 201,
      data: true,
      error: '',
      meta: null,
    }
  }
}

export const updateContract = async ({
  contract,
  files,
  currentFiles,
  id,
  userId,
}: {
  contract: Contract
  files: CustomFile[] | null
  currentFiles: CustomFile[] | null
  id: number | undefined
  userId: number | undefined
}): Promise<Response<boolean | string>> => {
  try {
    validateServiceOrderValue(contract)
    const resp = await api.put(`/contracts/${id}`, contract)
    await updateFile({ contractId: id, currentFiles, userId }, files, 'contracts')

    return {
      status: resp.status,
      data: resp.status === HttpStatusCode.Ok,
      error: '',
      meta: null,
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Ordem de Serviço')) {
      return { status: 400, data: false, error: error.message, meta: null }
    }
    ensureSeeded()
    console.warn('[LOCAL DB] Atualizando contrato localmente. ID:', id)
    if (id) {
      const enriched = await enrichContractWithFiles(contract, files)
      localDbUpdateContract(id, enriched as unknown as Partial<LocalContract>)
    }
    return {
      status: 200,
      data: true,
      error: '',
      meta: null,
    }
  }
}

export const editContractPaymentInfo = async (
  contract: EditPaymentInfo,
  id: number,
): Promise<Response<boolean | string>> => {
  try {
    const resp = await api.put(`/contracts/bancaryInfo/${id}`, contract)
    queryClient.refetchQueries({ queryKey: ['ContractById', id] })

    return {
      status: resp.status,
      data: resp.status === HttpStatusCode.Ok,
      error: '',
      meta: null,
    }
  } catch (error) {
    ensureSeeded()
    console.warn('[LOCAL DB] Atualizando dados bancários localmente. ID:', id)
    localDbUpdateContract(id, {
      bancaryInfo: contract.bancaryInfo,
      pixInfo: contract.pixInfo,
    } as unknown as Partial<LocalContract>)
    queryClient.refetchQueries({ queryKey: ['ContractById', id] })
    return {
      status: 200,
      data: true,
      error: '',
      meta: null,
    }
  }
}

export const getContractById = async (id: number | null): Promise<Response<IContract> | null> => {
  if (id) {
    try {
      const resp = await api.get<IContract>(`/contracts/${id}`)
      return {
        status: resp.status,
        data: resp.data,
        error: '',
        meta: null,
      }
    } catch (error) {
      ensureSeeded()
      console.warn('[LOCAL DB] Buscando contrato local. ID:', id)
      const local = localDbGetContractById(id)
      if (local) {
        return {
          status: 200,
          data: local,
          error: '',
          meta: null,
        }
      }
      return handleError<IContract>(error)
    }
  }
  return null
}

export const getHistoryById = async (
  id: number | null,
): Promise<Response<ContractPaymentHistory> | void> => {
  if (id) {
    try {
      const resp = await api.get<ContractPaymentHistory>(`/contracts/history/${id}`)

      return {
        status: resp.status,
        data: resp.data,
        error: '',
        meta: null,
      }
    } catch (error) {
      if (!isBackendOfflineError(error)) console.error(error)
      return handleError<ContractPaymentHistory>(error)
    }
  }
}

export const deleteContract = async (id: number): Promise<Response<void>> => {
  try {
    const resp = await api.delete<void>(`/contracts/${id}`)
    queryClient.invalidateQueries({ queryKey: ['contracts'] })
    queryClient.removeQueries({ queryKey: ['ContractById', id] })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    ensureSeeded()
    console.warn('[LOCAL DB] Removendo contrato local. ID:', id)
    localDbDeleteContract(id)
    queryClient.invalidateQueries({ queryKey: ['contracts'] })
    queryClient.removeQueries({ queryKey: ['ContractById', id] })
    return {
      status: 200,
      data: undefined,
      error: '',
      meta: null,
    }
  }
}

export const getCotnractsCSV = async (params: ParamsContracts): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('/contracts/csv', {
      params: flattenParams(params),
      responseType: 'blob',
    })
    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    if (!isBackendOfflineError(error)) console.error(error)
    return handleError<Blob>(error)
  }
}

export const getContractsPDF = async (params: ParamsContracts): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('/contracts/pdf', {
      params: flattenParams(params),
      responseType: 'blob',
    })
    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    if (!isBackendOfflineError(error)) console.error(error)
    return handleError<Blob>(error)
  }
}
