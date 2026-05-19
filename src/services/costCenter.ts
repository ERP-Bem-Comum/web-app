import { ICreateCostCenterCategory, IEditCostCenterCategory } from '@/types/category'
import { ICreateCostCenter, IEditCostCenter } from '@/types/costCenter'
import { Options } from '@/types/global'
import { ICreateCostCenterSubCategory } from '@/types/subCategory'
import { useQuery } from '@tanstack/react-query'
import api from './api'
import apiOptions from './apiOptions'
import { handleError } from '@/utils/errorHandling'

export function useGetCostCenterById(id: string | any) {
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

export function useGetCostCenterByBudgetPlan(id: number) {
  const { data, isLoading } = useQuery({
    queryKey: ['cost_center_by_budget_plan', id],
    queryFn: async () => {
      const resp = await api
        .get(`/cost-centers/all-by-budget-plan/${id}`)
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

export function useGetCostCenterActiveByBudgetPlan(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['cost-center-active-by-budget-plan', id],
    queryFn: async () => {
      const resp = await api
        .get(`/cost-centers/all-active-by-budget-plan/${id}`)
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

export const getCostCenterOptions = async () => {
  try {
    const resp = await apiOptions.get<Options[]>('/cost-centers/options')
    return resp.data ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}

export const getCategoriesOptions = async () => {
  try {
    const resp = await apiOptions.get<Options[]>('/cost-centers/categories/options')
    return resp.data ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}

export const getSubCategoriesOptions = async () => {
  try {
    const resp = await apiOptions.get<Options[]>('/cost-centers/categories/sub/options')
    return resp.data ?? []
  } catch (error) {
    console.error(error)
    return []
  }
}

export const createCostCenter = async (data: ICreateCostCenter) => {
  try {
    return await api.post('cost-centers', data)
  } catch (error: any) {
    console.error(error)
    return {
      status: error.response.data.status,
      data: {
        message: error.response.data.message,
      },
    }
  }
}

export const editCostCenter = async (data: Omit<IEditCostCenter, 'id'>, id: number) => {
  try {
    return await api.put(`cost-centers/${id}`, data)
  } catch (error: any) {
    console.error(error)
    return {
      status: error.response.data.status,
      data: {
        message: error.response.data.message,
      },
    }
  }
}

export const createCostCenterCategory = async (data: ICreateCostCenterCategory) => {
  try {
    return await api.post('cost-centers/categories', data)
  } catch (error: any) {
    console.error(error)
    return {
      status: error.response.data.status,
      data: {
        message: error.response.data.message,
      },
    }
  }
}

export const editCostCenterCategory = async (
  data: Omit<IEditCostCenterCategory, 'id'>,
  id: number,
) => {
  try {
    return await api.put(`cost-centers/categories/${id}`, data)
  } catch (error: any) {
    console.error(error)
    return {
      status: error.response.data.status,
      data: {
        message: error.response.data.message,
      },
    }
  }
}

export async function createCostCenterSubCategory(data: ICreateCostCenterSubCategory) {
  const response = await api
    .post(`/cost-centers/categories/sub`, data)
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

export async function editCostCenterSubCategory(id: number, data: ICreateCostCenterSubCategory) {
  const response = await api
    .put(`/cost-centers/categories/sub/${id}`, data)
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

export async function toggleActiveCostCenter(id: number) {
  try {
    const response = await api.patch(`/cost-centers/${id}/toggle-active`)
    return response.data
  } catch (error) {
    console.error(error)
    handleError<null>(error)
  }
}

export async function toggleActiveCostCenterCategory(id: number) {
  const response = await api
    .patch(`/cost-centers/categories/${id}/toggle-active`)
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

export async function toggleActiveCostCenterSubCategory(id: number) {
  const response = await api
    .patch(`/cost-centers/categories/sub/${id}/toggle-active`)
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

export const deleteCostCenter = async (id: number) => {
  const response = await api
    .delete(`/cost-centers/${id}`)
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

export const deleteCostCenterCategory = async (id: number) => {
  const response = await api
    .delete(`/cost-centers/categories/${id}`)
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
export async function deleteCostCenterSubCategory(id: number) {
  const response = await api
    .delete(`/cost-centers/categories/sub/${id}`)
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
