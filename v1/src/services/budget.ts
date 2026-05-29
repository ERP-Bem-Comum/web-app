import { useQuery } from '@tanstack/react-query'
import api from './api'

export type ICreateBudget = {
  budgetPlanId: number | null
  partnerStateId?: number | null | undefined
  partnerMunicipalityId?: number | null
}

export type ICreateResult = {
  id: number | null
  costCenterSubCategoryId: number | null
  month: number | null
  valueInCents: number | null
}

export type ICreateBudgetResult = {
  budgetId: number | null
  budgetResults: ICreateResult[]
}

export type ICreateScenery = {
  name: string
  budgetId: number
}

export type IBudget = {
  id: number
  name: string
  email: string
  cnpj: string
  corporateName: string
  fantasyName: string
  serviceCategory: string
  serviceEvaluation: number
  commentEvaluation: string
  active: boolean
}

export type IBudgetTable = {
  id: number
  children: any[]
  scenarioName?: string
  program: { name: string }
  status: string
  total: string
  updatedAt: Date
  updatedBy: { name: string }
  version: number
  year: number
}

export type IGetBudget = {
  page: number
  budgetPlanId?: number | null
  partnerStateId?: number | null
  partnerMunicipalityId?: number | null
  isForMonth?: number
}

export type IResult = {
  id: number
  costCenterCategoryId: number
  costCenterSubCategoryId: number
  month: number
  valueInCents: number
}

export async function createBudget(data: ICreateBudget) {
  const response = await api
    .post(`/budgets`, data)
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

export async function editBudget(id: number, data: ICreateBudget) {
  const response = await api
    .put(`/budgets/${id}`, data)
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

export async function createBudgetResult(data: ICreateBudgetResult) {
  const response = await api
    .post(`/budgets/results`, data)
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

export async function toggleActiveBudget(id: number | undefined) {
  const response = await api
    .patch(`/budgets/${id}/toggle-active`)
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

export async function deleteBudget(id: number) {
  const response = await api
    .delete(`/budgets/${id}`)
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

export function useGetBudgets(params: IGetBudget) {
  const { data, isLoading } = useQuery({
    queryKey: ['budgets', params],
    queryFn: async () => {
      const resp = await api
        .get(`/budgets`, {
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
      console.log('log resp', resp.data, params)
      return resp.data
    },
    staleTime: 1000 * 60 * 5,
  })

  return {
    data,
    isLoading,
  }
}

export function useGetBudgetById(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['budget_id', id],
    queryFn: async () => {
      const resp = await api
        .get(`/budgets/${id}`)
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

export async function getExportBudget(params: IGetBudget) {
  return api.get(`/budgets/csv`, {
    params,
    responseType: 'blob',
  })
}
