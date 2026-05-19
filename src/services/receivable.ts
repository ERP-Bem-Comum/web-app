import { CustomFile } from '@/components/files/fileItem'
import { Response } from '@/types/global'
import { Installments } from '@/types/installments'
import { IReceivable, ParamsReceivables, Receivable, ReceivableRow } from '@/types/receivables'
import { handleError } from '@/utils/errorHandling'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { HttpStatusCode } from 'axios'
import { queryClient } from 'lib/react-query'
import api from './api'
import { updateFile, uploadFile } from './files'
import { UseDebouncedSearch } from '@/hooks/useDebouncedSearch'
import { flattenParams } from '@/utils/flattenParams'
import { BlobResponse, getFileNameFromHeader } from '@/utils/getFileName'

export const useGetAllFilteredReceivables = ({
  paginationParams,
  receivableParams,
  search,
}: ParamsReceivables) => {
  const searchOnHold = UseDebouncedSearch(search)
  const {
    data,
    isLoading,
    error,
    isRefetching,
    refetch: refetchFilteredReceivables,
  } = useQuery({
    queryKey: ['filteredReceivables', paginationParams, receivableParams, searchOnHold],
    queryFn: () => getAllFilteredReceivables({ paginationParams, receivableParams, search }),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  })

  return {
    data,
    isLoading,
    isRefetching,
    error,
    refetchFilteredReceivables,
  }
}

export const useGetReceivableById = (id: number | null) => {
  const { data } = useQuery({
    queryKey: ['receivableById', id],
    queryFn: () => getReceivableById(id),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!id,
  })

  return {
    data,
  }
}

const getAllFilteredReceivables = async (
  params?: ParamsReceivables,
): Promise<Response<ReceivableRow[]>> => {
  try {
    const resp = await api.get('/receivables', {
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
    return handleError<ReceivableRow[]>(error)
  }
}

export const getReceivablesCsv = async (params: ParamsReceivables): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('/receivables/csv', {
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

export const getReceivablesPDF = async (params: ParamsReceivables): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('/receivables/pdf', {
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

export const createReceivable = async (
  receivable: Receivable,
  files: CustomFile[] | null,
): Promise<Response<boolean | string>> => {
  try {
    const resp = await api.post('/receivables', receivable)
    await uploadFile({ receivableId: resp.data }, files, 'receivable')
    queryClient.invalidateQueries({ queryKey: ['filteredReceivables'] })

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

export const updateReceivable = async ({
  receivable,
  files,
  currentFiles,
  id,
}: {
  receivable: Receivable
  files: CustomFile[] | null
  currentFiles: CustomFile[] | null
  id: number
}): Promise<Response<boolean | string>> => {
  try {
    const resp = await api.put(`/receivables/${id}`, receivable)

    await updateFile({ receivableId: id, currentFiles }, files, 'receivable')

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

export const getReceivableById = async (
  id: number | null,
): Promise<Response<IReceivable> | void> => {
  if (id) {
    try {
      const resp = await api.get<IReceivable>(`/receivables/${id}`)

      return {
        status: resp.status,
        data: resp.data,
        error: '',
        meta: null,
      }
    } catch (error) {
      console.error(error)
      return handleError<IReceivable>(error)
    }
  }
}

export const updateCategoryReceivable = async (
  receivable: Pick<Receivable, 'categorization'>,
  id: number,
): Promise<Response<boolean | string>> => {
  try {
    const resp = await api.put(`/receivables/category/${id}`, flattenParams(receivable))

    queryClient.refetchQueries({ queryKey: ['receivableById', id] })

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

export const updateReceivableInstallments = async (
  data: Installments[],
  id: number,
): Promise<Response<boolean | string>> => {
  try {
    const resp = await api.put(`/receivables/installments/${id}`, data)

    queryClient.invalidateQueries({ queryKey: ['receivableById', id] })

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

export const deleteReceivable = async (id: number): Promise<Response<void>> => {
  try {
    const resp = await api.delete<void>(`/receivables/${id}`)

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
