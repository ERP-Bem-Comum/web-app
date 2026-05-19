import { useQuery } from '@tanstack/react-query'
import api from './api'
import { Options } from '@/types/global'
import apiOptions from './apiOptions'

export type IAddCity = {
  name: string
  uf: string
  cod: string
}

export type ICity = {
  id: number
  name: string
  uf: string
  cod: string
}

export type IGetCity = {
  page?: number
  limit?: number
  search?: string
  active?: number
  order?: string
  uf?: string
}

export async function addCity(data: IAddCity) {
  const response = await api
    .post(`/partner-municipalities`, data)
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

export async function removeCity(id: number | undefined) {
  const response = await api
    .delete(`/partner-municipalities/${id}`)
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

export function useGetCities(params: IGetCity) {
  const { data, isLoading } = useQuery({
    queryKey: ['partner_municipalities', params],
    queryFn: async () => {
      const resp = await api
        .get(`/partner-municipalities`, { params })
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

export function useGetCityById(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['partner_municipalities_id', id],
    queryFn: async () => {
      const resp = await api
        .get(`/partner-municipalities/${id}`)
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

export const getCitiesOptions = async () => {
  try {
    const resp = await apiOptions.get<Options[]>(`/partner-municipalities/options`)
    return resp.data ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}
