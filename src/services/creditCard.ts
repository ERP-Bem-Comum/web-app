import { Response } from '@/types/global'
import { handleError } from '@/utils/errorHandling'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from './api'
import { queryClient } from 'lib/react-query'
import { UseDebouncedSearch } from '@/hooks/useDebouncedSearch'
import {
  CreateCreditCard,
  CreateCreditCardMov,
  CreditCard,
  CreditCardMov,
  ParamsCreditCard,
  ParamsCreditCardMov,
} from '@/types/creditCard'
import { flattenParams } from '@/utils/flattenParams'

type dataParams<T> = {
  id?: number | string
  data?: T
}

export const useGetCreditCard = (params: ParamsCreditCard) => {
  const debouncedSearch = UseDebouncedSearch(params.search)
  const { data, isLoading, error } = useQuery({
    queryKey: ['creditCards', debouncedSearch, params.paginationParams],
    queryFn: () => getCreditCards(params),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  })

  return {
    data,
    isLoading,
    error,
  }
}

export const useGetCreditCardById = (id?: number) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['creditCardById', id],
    queryFn: () => getCreditCardById({ id }),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!id,
  })

  return {
    data,
    isLoading,
    error,
  }
}

export const useGetMovimentations = (params: ParamsCreditCardMov) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['movimentations', params],
    queryFn: () => getMovimentations(params),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!params.cardId,
    retry: (f) => f < 4,
  })

  return {
    data,
    isLoading,
    error,
  }
}

export const useGetMovimentationById = (id?: number) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['movimentation', id],
    queryFn: () => getMovimentationById({ id }),
    refetchOnWindowFocus: false,
    placeholderData: undefined,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!id,
  })

  return {
    data,
    isLoading,
    error,
  }
}

const getCreditCards = async (params: ParamsCreditCard): Promise<Response<CreditCard[]>> => {
  try {
    const resp = await api.get('/cards', {
      params: flattenParams(params),
    })

    return {
      status: resp.status,
      data: resp.data.items,
      error: '',
      meta: resp.data?.meta ?? null,
    }
  } catch (error) {
    console.error(error)
    return handleError<CreditCard[]>(error)
  }
}

const getCreditCardById = async ({ id }: dataParams<unknown>): Promise<Response<CreditCard>> => {
  try {
    const resp = await api.get(`/cards/${id}`)

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    console.error(error)
    return handleError<CreditCard>(error)
  }
}

export const CreateCard = async ({
  data,
}: dataParams<CreateCreditCard>): Promise<Response<void>> => {
  try {
    const resp = await api.post(`/cards`, data)

    queryClient.invalidateQueries({
      queryKey: ['creditCards'],
    })

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

export const updateCard = async ({ data, id }: dataParams<CreditCard>): Promise<Response<void>> => {
  try {
    const resp = await api.put(`/cards/${id}`, data)

    queryClient.invalidateQueries({ queryKey: ['creditCards'] })

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

export const deleteCard = async ({ id }: dataParams<unknown>): Promise<Response<void>> => {
  try {
    const resp = await api.delete<void>(`/cards/${id}`)
    queryClient.invalidateQueries({
      queryKey: ['creditCards'],
    })

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

const getMovimentations = async (
  params: ParamsCreditCardMov,
): Promise<Response<CreditCardMov[]>> => {
  try {
    const resp = await api.get<CreditCardMov[]>('/card-movimentations', {
      params,
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<CreditCardMov[]>(error)
  }
}

const getMovimentationById = async ({
  id,
}: dataParams<unknown>): Promise<Response<CreditCardMov>> => {
  try {
    const resp = await api.get(`/card-movimentations/${id}`)

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    console.error(error)
    return handleError<CreditCardMov>(error)
  }
}

export const CreateMovimentation = async ({
  data,
}: dataParams<CreateCreditCardMov>): Promise<Response<void>> => {
  try {
    const resp = await api.post(`/card-movimentations`, data)

    queryClient.invalidateQueries({
      queryKey: ['movimentations'],
    })

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

export const updateMovimentation = async ({
  data,
  id,
}: dataParams<CreditCardMov>): Promise<Response<void>> => {
  try {
    const resp = await api.put(`/card-movimentations/${id}`, data)

    queryClient.invalidateQueries({
      queryKey: ['movimentations'],
    })
    queryClient.invalidateQueries({
      queryKey: ['movimentation', id],
    })
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

export const deleteMovimentation = async ({ id }: dataParams<unknown>): Promise<Response<void>> => {
  try {
    const resp = await api.delete<void>(`/card-movimentations/${id}`)
    queryClient.invalidateQueries({
      queryKey: ['movimentations'],
    })

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

export const getMovCsv = async (params: ParamsCreditCardMov): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('/card-movimentations/csv', {
      params,
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

export const getMovPDF = async (params: ParamsCreditCardMov): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('/card-movimentations/pdf', {
      params,
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

export const ProcessMovimentations = async (
  data: ParamsCreditCardMov,
): Promise<Response<{ payableId: number }>> => {
  try {
    const resp = await api.post<{ payableId: number }>(`/card-movimentations/process`, data)

    queryClient.invalidateQueries({
      queryKey: ['movimentations'],
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<{ payableId: number }>(error)
  }
}
