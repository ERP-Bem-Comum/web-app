import { ContractForAccounts } from '@/types/contracts'
import { Options, Response } from '@/types/global'
import { handleError } from '@/utils/errorHandling'
import { useQuery } from '@tanstack/react-query'
import api from './api'
import { queryClient } from 'lib/react-query'
import apiOptions from './apiOptions'

export type ICreateFinancier = {
  name: string
  corporateName: string
  cnpj: string
  telephone: string
  legalRepresentative: string
  address: string
}

export type IFinancier = {
  id: number
  name: string
  corporateName: string
  cnpj: string
  telephone: string
  legalRepresentative: string
  address: string
  active: boolean
  contracts: ContractForAccounts[]
}

export type IGetFinancier = {
  page: number
  limit: number
  search?: string
}

export async function createFinancier(data: ICreateFinancier) {
  const response = await api
    .post(`/financiers`, data)
    .then((response) => {
      return response
    })
    .catch((error) => {
      return {
        status: 400,
        data: {
          message: error.response.data.message,
        },
      }
    })
  return response.data
}

export async function editFinancier(id: number, data: ICreateFinancier) {
  const response = await api
    .put(`/financiers/${id}`, data)
    .then((response) => {
      return response
    })
    .catch((error) => {
      return {
        status: 400,
        data: {
          message: error.response.data.message,
        },
      }
    })
  return response.data
}

export async function toggleActiveFinancier(id: number | undefined) {
  try {
    const response = await api.patch(`/financiers/${id}/toggle-active`)
    return response.data
  } catch (error) {
    handleError<null>(error)
  }
}

export function useGetFinanciers(params: IGetFinancier) {
  const { data, isLoading } = useQuery({
    queryKey: ['financiers', params],
    queryFn: async () => {
      const resp = await api
        .get(`/financiers`, {
          params,
        })
        .then((response) => {
          return response
        })
        .catch((error) => {
          return {
            status: 400,
            data: {
              message: error?.response?.data?.message,
            },
          }
        })
      return resp.data
    },
    staleTime: 1000 * 60 * 5,
  })

  return {
    data,
    isLoading,
  }
}

export function useGetFinancierById(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['financier_id', id],
    queryFn: async () => {
      const resp = await api
        .get(`/financiers/${id}`)
        .then((response) => {
          return response
        })
        .catch((error) => {
          return {
            status: 400,
            data: {
              message: error?.response?.data?.message,
            },
          }
        })
      return resp.data
    },
    staleTime: 1000 * 60 * 5,
  })

  return {
    data,
    isLoading,
  }
}

export const getFinancierByNameOrCNPJ = async (
  nameOrCNPJ: string,
): Promise<Response<IFinancier>> => {
  try {
    const resp = await api.get(`/financiers/nameOrCNPJ`, {
      params: {
        nameOrCNPJ,
      },
    })
    return {
      status: resp.status,
      data: resp.data,
      error: resp.statusText,
      meta: null,
    }
  } catch (error) {
    return handleError(error)
  }
}

export async function getExportFinancier(params: IGetFinancier) {
  return api.get(`/financiers/csv`, {
    params,
    responseType: 'blob',
  })
}

export const getFinancierOptions = async () => {
  try {
    const resp = await apiOptions.get<Options[]>(`/financiers/options`)
    return resp.data ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}
