import { useQuery } from '@tanstack/react-query'
import api from './api'
import { Options } from '@/types/global'
import apiOptions from './apiOptions'

export type IAddState = {
  name?: string
  abbreviation: string
}

export type IState = {
  id: number
  name: string
  abbreviation: string
}

export async function addState(data: IAddState) {
  const response = await api
    .post(`/partner-states`, data)
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

export async function removeState(id: number | undefined) {
  const response = await api
    .delete(`/partner-states/${id}`)
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

export function useGetStates() {
  const { data, isLoading } = useQuery({
    queryKey: ['partner_states'],
    queryFn: async () => {
      const resp = await api
        .get(`/partner-states`)
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

export function useGetStateById(id: string | any) {
  const { data, isLoading } = useQuery({
    queryKey: ['partner_state_id', id],
    queryFn: async () => {
      const resp = await api
        .get(`/partner-states/${id}`)
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
    enabled: !!id,
  })

  return {
    data,
    isLoading,
  }
}

export const getStateOptions = async () => {
  try {
    const resp = await apiOptions.get<Options[]>(`/partner-states/options`)
    return resp.data ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}
