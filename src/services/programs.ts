import { Options } from '@/types/global'
import { useQuery } from '@tanstack/react-query'
import api from './api'
import apiOptions from './apiOptions'

export type ICreateProgram = {
  name?: string
  abbreviation: string
  director: string
  description: string
  file?: File
}

export type IProgram = {
  id: number
  name: string
  abbreviation: string
  director: string
  description: string
  logo: string
  active: boolean
}

export type IGetProgram = {
  page: number
  limit: number
  search?: string
  active?: number | null
}

export async function createProgram(data: ICreateProgram) {
  const response = await api
    .post(`/programs`, data, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    })
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

export async function editProgram(id: number, data: ICreateProgram) {
  const response = await api
    .put(`/programs/${id}`, data, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    })
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

export async function toggleActiveProgram(id: number | undefined) {
  const response = await api
    .patch(`/programs/${id}/toggle-active`)
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

export function useGetPrograms(params: IGetProgram) {
  const { data, isLoading } = useQuery({
    queryKey: ['programs', params],
    queryFn: async () => {
      const resp = await api
        .get(`/programs`, {
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

export const getProgramOptions = async () => {
  try {
    const resp = await apiOptions.get<Options[]>('/programs/options')
    return resp.data ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function getPrograms(params: IGetProgram) {
  const resp = await api
    .get(`/programs`, {
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

export function useGetProgramById(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['program_id', id],
    queryFn: async () => {
      const resp = await api
        .get(`/programs/${id}`)
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
