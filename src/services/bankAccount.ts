import { BankAccount, BankAccountRow, EditBankAccount } from '@/types/bankAccount'
import { Options, Response } from '@/types/global'
import { handleError } from '@/utils/errorHandling'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from './api'
import { queryClient } from 'lib/react-query'
import apiOptions from './apiOptions'

export const useGetBankAccounts = () => {
  const {
    data,
    isLoading,
    error,
    isRefetching,
    refetch: refetchFilteredReceivables,
  } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: () => getBankAccounts(),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

  return {
    data,
    isLoading,
    isRefetching,
    error,
    refetchFilteredReceivables,
  }
}

export const useGetBankAccountById = (id: number) => {
  const {
    data,
    isLoading,
    error,
    isRefetching,
    refetch: refetchFilteredReceivables,
  } = useQuery({
    queryKey: ['bankAccountById', id],
    queryFn: () => getBankAccountById(id),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

  return {
    data,
    isLoading,
    isRefetching,
    error,
    refetchFilteredReceivables,
  }
}

const getBankAccounts = async (): Promise<Response<BankAccountRow[]>> => {
  try {
    const resp = await api.get('/accounts')

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    console.error(error)
    return handleError<BankAccountRow[]>(error)
  }
}

const getBankAccountById = async (id: number): Promise<Response<EditBankAccount>> => {
  try {
    const resp = await api.get(`/accounts/${id}`)

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    console.error(error)
    return handleError<EditBankAccount>(error)
  }
}

export const getBankAccountOptions = async () => {
  try {
    const resp = await apiOptions.get<Options[]>(`/accounts/options`)
    return resp.data
  } catch (error) {
    console.error(error)
    return []
  }
}

export const createBankAccount = async (data: BankAccount): Promise<Response<void>> => {
  try {
    const resp = await api.post(`/accounts`, data)

    queryClient.invalidateQueries({
      queryKey: ['bankAccounts'],
    })
    queryClient.invalidateQueries({ queryKey: ['accountsOptions'] })

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

export const updateBankAccount = async (id: number, data: BankAccount): Promise<Response<void>> => {
  try {
    const resp = await api.put(`/accounts/${id}`, data)

    queryClient.invalidateQueries({ queryKey: ['accountsOptions'] })

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

export const deleteBankAccount = async (id: number): Promise<Response<void>> => {
  try {
    const resp = await api.delete<void>(`/account/${id}`)

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
