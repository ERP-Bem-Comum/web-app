import { IContract } from '@/types/contracts'
import { Options, Response } from '@/types/global'
import { handleError } from '@/utils/errorHandling'
import { useQuery } from '@tanstack/react-query'
import api from './api'
import apiOptions from './apiOptions'
import { queryClient } from 'lib/react-query'
import { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'

export type ICreatePreCollaborator = {
  name: string
  email: string
  occupationArea: string | null
  role: string | null
  startOfContract: Date | null
  employmentRelationship: string | null
  cpf: string
}

export type ICollaborator = {
  id: number
  name: string
  email: string
  occupationArea: string
  role: string
  startOfContract: Date
  employmentRelationship: string
  cpf: string
  rg?: string
  completeAddress?: string
  dateOfBirth?: Date
  telephone?: string
  emergencyContactName?: string
  emergencyContactTelephone?: string
  genderIdentity?: string
  race?: string
  allergies?: string
  foodCategory?: string
  education?: string
  experienceInThePublicSector?: boolean
  biography?: string
  active?: boolean
  contracts?: IContract[]
}

export type IGetCollaborator = {
  page: number
  limit: number
  search?: string
  age?: string
  yearOfContract?: string | null
  genderIdentities?: string[]
  breeds?: string[]
  educations?: string[]
  status?: string[]
  occupationAreas?: string[]
  employmentRelationships?: string[]
  disableBy: string[]
  roles: string[]
  active?: number | null
}

export async function createCollaborator(data: ICreatePreCollaborator) {
  const response = await api
    .post(`/collaborators`, data)
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

export async function editCollaborator(id: number, data: ICreatePreCollaborator) {
  const response = await api
    .put(`/collaborators/${id}`, data)
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

export async function toggleActiveCollaborator(
  id: number | undefined,
  data?: { disableBy: string | null },
) {
  try {
    const response = await api.patch(`/collaborators/${id}/toggle-active`, data)
    return response.data
  } catch (error) {
    return handleError<null>(error)
  }
}

export function useGetCollaborators(params: IGetCollaborator) {
  const { data, isLoading } = useQuery({
    queryKey: ['collaborators', params],
    queryFn: async () => {
      const resp = await api
        .get(`/collaborators`, {
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

export function useGetCollaboratorById(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['collaborator_id', id],
    queryFn: async () => {
      const resp = await api
        .get(`/collaborators/${id}`)
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

export const getCollaboratorsOptions = async () => {
  try {
    const resp = await apiOptions.get<Options[]>('/collaborators/options')
    return resp.data ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function checkCpfCollaborator(data: { id: string; cpf: string }) {
  const response = await api
    .get(`/collaborators/${data.id}/check-first-three-numbers-cpf/${data.cpf}`)
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

export async function createCompleteCollaborator(
  id: number | undefined,
  data: ICreatePreCollaborator,
) {
  const response = await api
    .post(`/collaborators/${id}/complete-registration`, data)
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

export async function getExportCollaborator(params: IGetCollaborator) {
  return api.get(`/collaborators/csv`, {
    params,
    responseType: 'blob',
  })
}

export async function getExportCollaboratorTimeline(params: IGetCollaborator) {
  return api.get(`/collaborators/timeline/csv`, {
    params,
    responseType: 'blob',
  })
}

export const useGetCollaboratorByNameOrCPF = (nameOrCNPJ: string, payableId?: number) => {
  const { refetch } = useQuery({
    queryKey: ['collaboratorByNameOrCPF'],
    queryFn: () => getCollaboratorByNameOrCPF(nameOrCNPJ, payableId),
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

export type ImportCollaboratorsResponse = {
  status: number
  headers: AxiosResponseHeaders | RawAxiosResponseHeaders
  jsonData: any | null
  blob: Blob
}

export const importCollaborators = async (file: File): Promise<ImportCollaboratorsResponse> => {
  const response = await api.post(
    `/collaborators/import`,
    { file },
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      validateStatus: () => true,
    },
  )

  const contentType = response.headers['content-type'] || ''
  let jsonData: any = null
  let blob: Blob | null = null

  // A API pode retornar JSON ou blob dependendo do caso
  if (contentType.includes('application/json') || contentType.includes('text/json')) {
    // Resposta JSON direta
    jsonData = response.data
  } else if (response.data instanceof Blob) {
    // Resposta blob (arquivo de erros)
    blob = response.data
    // Tentar extrair JSON se o blob contiver JSON
    try {
      const text = await response.data.text()
      jsonData = JSON.parse(text)
      // Se parseou, criar novo blob do texto original
      blob = new Blob([text], { type: 'application/json' })
    } catch {
      // Se não for JSON, manter o blob original
    }
  } else {
    // Tentar como JSON por padrão
    jsonData = response.data
  }

  return {
    status: response.status,
    headers: response.headers,
    jsonData,
    blob: blob || (response.data instanceof Blob ? response.data : new Blob()),
  }
}

const getCollaboratorByNameOrCPF = async (
  nameOrCPF: string,
  payableId?: number,
): Promise<Response<ICollaborator>> => {
  try {
    const resp = await api.get(`/collaborators/nameOrCPF`, {
      params: {
        nameOrCPF,
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
