import { EditPaymentInfo, Options, Response } from '@/types/global'
import { ICreateSupplier, IGetSupplier, ISupplier } from '@/types/supplier'
import { handleError } from '@/utils/errorHandling'
import { useQuery } from '@tanstack/react-query'
import api from './api'
import { queryClient } from 'lib/react-query'
import apiOptions from './apiOptions'

export async function createSupplier(data: ICreateSupplier): Promise<Response<null>> {
  try {
    const response = await api.post(`/suppliers`, data)
    queryClient.invalidateQueries({ queryKey: ['suppliers'] })

    return {
      status: response.status,
      data: null,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<null>(error)
  }
}

export async function editSupplier(
  id: number,
  data: ICreateSupplier | EditPaymentInfo,
): Promise<Response<null>> {
  try {
    const response = await api.put(`/suppliers/${id}`, data)
    queryClient.invalidateQueries({ queryKey: ['supplier_id', id] })
    return {
      status: response.status,
      data: null,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<null>(error)
  }
}

export async function toggleActiveSupplier(id: number | undefined) {
  try {
    const response = await api.patch(`/suppliers/${id}/toggle-active`)
    queryClient.invalidateQueries({ queryKey: ['supplier_id', id] })
    queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    queryClient.invalidateQueries({ queryKey: ['suppliersOptions'] })

    return response.data
  } catch (error) {
    handleError<null>(error)
  }
}

export const getSuppliers = async (params: IGetSupplier) => {
  const resp = await api
    .get(`/suppliers`, {
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
}

export const useGetSupplierByNameOrCNPJ = (nameOrCNPJ: string, payableId?: number) => {
  const { refetch } = useQuery({
    queryKey: ['supplierByNameOrCPF', nameOrCNPJ],
    queryFn: () => getSupplierByNameOrCNPJ(nameOrCNPJ, payableId),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    enabled: false,
  })

  return {
    refetch,
  }
}

const getSupplierByNameOrCNPJ = async (
  nameOrCNPJ: string,
  payableId?: number,
): Promise<Response<ISupplier>> => {
  try {
    const resp = await api.get(`/suppliers/nameOrCNPJ`, {
      params: {
        nameOrCNPJ,
        payableOrReceivableId: payableId,
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

export function useGetSuppliers(params: IGetSupplier) {
  const {
    data,
    isLoading,
    refetch: refetchSupplier,
  } = useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => getSuppliers(params),
    staleTime: 1000 * 60 * 5,
  })

  return {
    data,
    isLoading,
    refetchSupplier,
  }
}

export function useGetSupplierById(id: number) {
  const { data, isLoading } = useQuery({
    queryKey: ['supplier_id', id],
    queryFn: async () => {
      const resp = await api
        .get(`/suppliers/${id}`)
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

export async function getExportSupplier(params: IGetSupplier) {
  return api.get(`/suppliers/csv`, {
    params,
    responseType: 'blob',
  })
}

export const getSupplierOptions = async () => {
  try {
    const resp = await apiOptions.get<Options[]>(`/suppliers/options`)
    return resp.data ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}
