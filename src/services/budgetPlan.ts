import {
  ICheckCredentialsBudgetPlan,
  ICreateBudgetPlan,
  ICreateScenery,
  IGetBudgetPlan,
  IGetConsolidated,
} from '@/types/budgetPlan'
import { Options } from '@/types/global'
import { IShareBudgetPlan, IShareBudgetPlanConsolidated } from '@/types/sharedBudgetPlan'
import { useQuery } from '@tanstack/react-query'
import api from './api'
import apiOptions from './apiOptions'

export async function createBudgetPlan(data: ICreateBudgetPlan) {
  const response = await api
    .post(`/budget-plans`, data)
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

export async function editBudgetPlan(id: number, data: ICreateBudgetPlan) {
  const response = await api
    .put(`/budget-plans/${id}`, data)
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

export async function toggleActiveBudgetPlan(id: number | undefined) {
  const response = await api
    .patch(`/budget-plans/${id}/toggle-active`)
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

export async function deleteBudgetPlan(id: number) {
  const response = await api
    .delete(`/budget-plans/${id}`)
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

export function useGetBudgetPlans(params: IGetBudgetPlan) {
  const { data, isLoading } = useQuery({
    queryKey: ['budget_plans', params],
    queryFn: async () => {
      const resp = await api
        .get(`/budget-plans`, {
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
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  return {
    data,
    isLoading,
  }
}

export function useGetBudgetPlanById(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['budget_plan_id', id],
    queryFn: async () => {
      const resp = await api
        .get(`/budget-plans/${id}`)
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
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!id,
  })

  return {
    data,
    isLoading,
  }
}

export async function getExportBudgetPlan(params: IGetBudgetPlan) {
  return api.get(`/budget-plans/csv`, {
    params,
    responseType: 'blob',
  })
}

export async function approveBudgetPlan(id: number) {
  const response = await api
    .patch(`/budget-plans/${id}/approve`)
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

export async function createScenery(data: ICreateScenery) {
  const response = await api
    .post(`/budget-plans/scenery`, data)
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

export async function startCalibration(id: number) {
  const response = await api
    .post(`/budget-plans/${id}/start-calibration`)
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

export async function exportBudgetPlanCSV(id: number) {
  const response = await api
    .get(`/budget-plans/${id}/generate-csv`)
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

export async function shareBudgetPlan(data: IShareBudgetPlan) {
  const response = await api
    .post(`/share-budget-plans`, data)
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

export async function checkCredentialsBudgetPlan(data: ICheckCredentialsBudgetPlan) {
  const response = await api
    .post(`/share-budget-plans/check-credentials`, data)
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

export function useGetBudgetPlanInsight(id: number, enabled: boolean) {
  const { data, isLoading } = useQuery({
    queryKey: ['budget_plan_insight', id],
    queryFn: async () => {
      const resp = await api
        .get(`/budget-plans/${id}/insights`)
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
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: enabled && !!id,
  })

  return {
    data,
    isLoading,
  }
}

export const getBudgetPlanOptions = async () => {
  try {
    const resp = await apiOptions.get<Options[]>('/budget-plans/options')
    return resp.data ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}

export function useGetConsolidated(params: IGetConsolidated, enabled: boolean) {
  const { data, isLoading } = useQuery({
    queryKey: ['consolidated', params],
    queryFn: async () => {
      const resp = await api
        .get(`/budget-plans/consolidated-result`, {
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
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled,
  })

  return {
    data,
    isLoading,
  }
}

export async function exportBudgetPlanConsolidatedCSV(params: IGetConsolidated) {
  const response = await api
    .get(`/budget-plans/consolidated-result/csv`, { params })
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

export async function shareBudgetPlanConsolidated(data: IShareBudgetPlanConsolidated) {
  const response = await api
    .post(`/share-budget-plans/consolidated-result`, data)
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
