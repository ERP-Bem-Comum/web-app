import { useQuery } from '@tanstack/react-query'
import apiShared from './apiShared'
import { IGetBudget } from './budget'
import { IGetCity } from './city'

export function useGetBudgetPlanByIdShared(id: string, enabled: boolean) {
  const { data, isLoading } = useQuery({
    queryKey: ['budget_plan_id_shared', id],
    queryFn: async () => {
      const resp = await apiShared
        .get(`/budget-plans/${id}/shared`)
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
    enabled,
  })

  return {
    data,
    isLoading,
  }
}

export function useGetBudgetsShared(params: IGetBudget) {
  const { data, isLoading } = useQuery({
    queryKey: ['budgets_shared', params],
    queryFn: async () => {
      const resp = await apiShared
        .get(`/budgets/all/shared`, {
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

export async function exportBudgetPlanCSVShared(params: { id: number; email: string }) {
  const response = await apiShared
    .get(`/budget-plans/${params.id}/generate-csv/shared`, { params })
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

export function useGetCostCenterByBudgetPlanShared(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['cost_center_by_budget_plan_shared', id],
    queryFn: async () => {
      const resp = await apiShared
        .get(`/cost-centers/all-by-budget-plan/${id}/shared`)
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

export function useGetStatesShared() {
  const { data, isLoading } = useQuery({
    queryKey: ['partner_states_shared'],
    queryFn: async () => {
      const resp = await apiShared
        .get(`/partner-states/all/shared`)
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

export function useGetCitiesShared(params: IGetCity) {
  const { data, isLoading } = useQuery({
    queryKey: ['partner_municipalities_shared', params],
    queryFn: async () => {
      const resp = await apiShared
        .get(`/partner-municipalities/all/shared`, { params })
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

export function useGetBudgetPlanInsightShared(id: number, enabled: boolean) {
  const { data, isLoading } = useQuery({
    queryKey: ['budget_plan_insight', id],
    queryFn: async () => {
      const resp = await apiShared
        .get(`/budget-plans/${id}/insights/shared`)
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
    enabled,
  })

  return {
    data,
    isLoading,
  }
}

export function useGetConsolidatedShared(enabled: boolean) {
  const { data, isLoading } = useQuery({
    queryKey: ['consolidated_shared'],
    queryFn: async () => {
      const resp = await apiShared
        .get(`/budget-plans/consolidated-result/shared`)
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
    enabled,
  })

  return {
    data,
    isLoading,
  }
}

export async function exportConsolidatedCSVShared(params: { email: string }) {
  const response = await apiShared
    .get(`/budget-plans/consolidated-result/csv/shared`, { params })
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
