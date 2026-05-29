import { useQuery } from '@tanstack/react-query'
import api from './api'

export type ICreateUser = {
  name?: string
  email?: string
  cpf?: string
  telephone?: string
  file?: File
  massApprovalPermission?: boolean
}

export type IUser = {
  id: number
  name: string
  email: string
  cpf: string
  telephone: string
  imageUrl: string
  token: string
  active?: boolean
  massApprovalPermission?: boolean
  collaboratorId?: number
}

export type IGetUser = {
  page: number
  limit: number
  search?: string
  active?: number | null
}

export type IChangePassword = {
  password: string
  currentPassword: string
}

export async function createUser(data: ICreateUser) {
  const submitData = {
    ...data,
    massApprovalPermission: data.massApprovalPermission || false,
  }

  const response = await api
    .post(`/users`, submitData, {
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

export async function editUser(id: number, data: ICreateUser) {
  const submitData = {
    ...data,
    massApprovalPermission: data.massApprovalPermission || false,
  }

  const response = await api
    .put(`/users/${id}`, submitData, {
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

export async function toggleActiveUser(id: number | undefined) {
  const response = await api
    .patch(`/users/${id}/toggle-active`)
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

export function useGetUsers(params: IGetUser) {
  const { data, isLoading } = useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const resp = await api
        .get(`/users`, {
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

export function useGetUserById(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['user_id', id],
    queryFn: async () => {
      const resp = await api
        .get(`/users/${id}`)
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

export async function changePassword(data: IChangePassword) {
  const response = await api
    .patch(`/users/change-password`, data)
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

export async function getAllUsers(params: IGetUser) {
  const response = await api
    .get(`/users`, {
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
  return response.data
}