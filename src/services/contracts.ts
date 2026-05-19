import { CustomFile } from '@/components/files/fileItem'
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

export const useGetAllFilteredContracts = ({
  paginationParams,
  payableParams,
  search,
  agreement,
}: ParamsContracts) => {
  const searchOnHold = UseDebouncedSearch(search)

  const {
    data,
    isLoading,
    error,
    refetch: refetchFilteredContracts,
    isRefetching,
  } = useQuery({
    queryKey: ['contracts', payableParams, paginationParams, searchOnHold, agreement],
    queryFn: () => getAllFilteredContracts({ paginationParams, payableParams, search, agreement }),
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
    console.error(error)
    return handleError<ContractRow[]>(error)
  }
}

export const createContract = async (
  contract: Contract,
  files: CustomFile[] | null,
): Promise<Response<boolean | string>> => {
  try {
    const resp = await api.post('/contracts', contract)
    await uploadFile({ contractId: resp.data }, files, 'contracts')
    queryClient.invalidateQueries({ queryKey: ['contracts'] })

    return {
      status: resp.status,
      data: resp.status === HttpStatusCode.Created,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<boolean | string>(error)
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

    return {
      status: resp.status,
      data: resp.status === HttpStatusCode.Created,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<boolean | string>(error)
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
    const resp = await api.put(`/contracts/${id}`, contract)
    await updateFile({ contractId: id, currentFiles, userId }, files, 'contracts')

    return {
      status: resp.status,
      data: resp.status === HttpStatusCode.Ok,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<boolean | string>(error)
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
    console.error(error)
    return handleError<boolean | string>(error)
  }
}

export const getContractById = async (id: number | null): Promise<Response<IContract> | void> => {
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
      console.error(error)
      return handleError<IContract>(error)
    }
  }
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
      console.error(error)
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
    console.error(error)
    return handleError<void>(error)
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
    console.error(error)
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
    console.error(error)
    return handleError<Blob>(error)
  }
}
