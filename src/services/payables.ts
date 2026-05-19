import { CustomFile } from '@/components/files/fileItem'
import {
  ApproveManyPayables,
  credentials,
  IApproval,
  IApprove,
  ICredentialsApprovePayable,
} from '@/types/approvals'
import { Response } from '@/types/global'
import { Installments } from '@/types/installments'
import {
  IPayables,
  ParamsPayables,
  ParamsPayablesApproval,
  Payable,
  PayableRow,
} from '@/types/Payables'
import { handleError } from '@/utils/errorHandling'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { HttpStatusCode } from 'axios'
import { queryClient } from 'lib/react-query'
import api from './api'
import { updateFile, uploadFile } from './files'
import { UseDebouncedSearch } from '@/hooks/useDebouncedSearch'
import { flattenParams } from '@/utils/flattenParams'

export const useGetAllFilteredPayables = ({
  paginationParams,
  search,
  payableParams,
}: ParamsPayables) => {
  const searchOnHold = UseDebouncedSearch(search)

  const {
    data,
    isLoading,
    error,
    refetch: refetchFilteredPayables,
    isRefetching,
  } = useQuery({
    queryKey: ['filteredPayables', paginationParams, searchOnHold, payableParams],
    queryFn: () =>
      getAllFilteredPayables({
        paginationParams,
        search,
        payableParams,
      }),
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
    refetchFilteredPayables,
  }
}

export const useGetPayableById = (id: number | null) => {
  const { data, isLoading } = useQuery({
    queryKey: ['payablesById', id],
    queryFn: () => getPayableById(id),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    enabled: !!id,
  })

  return {
    data,
    isLoading,
  }
}

export const useGetAllPayablesForApproval = (params: ParamsPayablesApproval) => {
  const { data, isLoading } = useQuery({
    queryKey: ['PayablesForApprovals', params.paginationParams, params.userId],
    queryFn: () => getAllPayablesForApproval(params),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    enabled: !!params.userId,
  })

  return {
    data,
    isLoading,
  }
}

const getAllFilteredPayables = async (params?: ParamsPayables): Promise<Response<PayableRow[]>> => {
  try {
    const resp = await api.get('/payables', {
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
    return handleError<PayableRow[]>(error)
  }
}

const getAllPayablesForApproval = async (
  params: ParamsPayablesApproval,
): Promise<Response<PayableRow[]>> => {
  try {
    const resp = await api.get('/payables/massApproval', {
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
    return handleError<PayableRow[]>(error)
  }
}

export const getPayablesCsv = async (params: ParamsPayables): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('/payables/csv', {
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

export const getPayablesPDF = async (params: ParamsPayables): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('/payables/pdf', {
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

export const createPayable = async (
  payable: Payable,
  files: CustomFile[] | null,
): Promise<Response<boolean | string>> => {
  try {
    const resp = await api.post('/payables', payable)
    await uploadFile({ payableId: resp.data }, files, 'payable')
    queryClient.invalidateQueries({ queryKey: ['filteredPayables'] })
    queryClient.invalidateQueries({ queryKey: ['PayablesForApprovals'] })

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

export const updatePayable = async ({
  payable,
  files,
  currentFiles,
  id,
}: {
  payable: Payable
  files: CustomFile[] | null
  currentFiles: CustomFile[] | null
  id: number
}): Promise<Response<boolean | string>> => {
  try {
    const resp = await api.put(`/payables/${id}`, payable)
    await updateFile({ payableId: id, currentFiles }, files, 'payable')

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

export const updatePayableinstallments = async (
  data: Installments[],
  id: number,
): Promise<Response<boolean | string>> => {
  try {
    const resp = await api.put(`/payables/installments/${id}`, data)

    queryClient.invalidateQueries({ queryKey: ['payablesById', id] })

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

export const updateCategoryPayable = async (
  payable: Pick<Payable, 'categorization'>,
  id: number,
): Promise<Response<boolean | string>> => {
  try {
    const resp = await api.put(`/payables/category/${id}`, flattenParams(payable))

    queryClient.invalidateQueries({ queryKey: ['payablesById', id] })
    queryClient.invalidateQueries({ queryKey: ['filteredPayables'] })

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

export const getPayableById = async (id: number | null): Promise<Response<IPayables> | void> => {
  if (id) {
    try {
      const resp = await api.get<IPayables>(`/payables/${id}`)

      return {
        status: resp.status,
        data: resp.data,
        error: '',
        meta: null,
      }
    } catch (error) {
      console.error(error)
      return handleError<IPayables>(error)
    }
  }
}

export const approveAccess = async (credentials: ICredentialsApprovePayable) => {
  try {
    const resp = await api.post<IApproval>('/payables/approveAccess', credentials)
    return {
      status: resp.status,
      data: resp.data,
      error: '',
    }
  } catch (error) {
    console.error(error)
    return handleError<IApproval>(error)
  }
}

export const approvePayable = async (id: number, data: IApprove) => {
  try {
    const resp = await api.patch<IApprove>(`/payables/approve/${id}`, data)

    queryClient.invalidateQueries({ queryKey: ['payablesById', id] })
    return {
      status: resp.status,
      data: resp.data,
      error: '',
    }
  } catch (error) {
    console.error(error)
    return handleError<IApprove>(error)
  }
}

export const approveManyPayable = async (ids: number[], data: ApproveManyPayables) => {
  const fullData = { ids, data }
  try {
    const resp = await api.patch<ApproveManyPayables>(`/payables/massApproval`, fullData)

    queryClient.invalidateQueries({ queryKey: ['PayablesForApprovals'] })
    return {
      status: resp.status,
      data: resp.data,
      error: '',
    }
  } catch (error) {
    console.error(error)
    return handleError<ApproveManyPayables>(error)
  }
}

export const getPayableForApprovalById = async (
  data: credentials,
): Promise<Response<IPayables>> => {
  try {
    const resp = await api.get<IPayables>(`/payables/approve/${data.payableId}`, {
      params: data,
    })
    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<IPayables>(error)
  }
}

export const deletePayable = async (id: number): Promise<Response<void>> => {
  try {
    const resp = await api.delete<void>(`/payables/${id}`)
    queryClient.invalidateQueries({ queryKey: ['filteredPayables'] })

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
