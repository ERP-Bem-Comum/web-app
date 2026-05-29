import { useQuery } from '@tanstack/react-query'
import api from './api'

export type ICreateIpcaMonth = {
  month: number
  baseValueInCents: number
  ipca: number
  justification: string | null | undefined
}

export type ICreateCaedMonth = {
  month: number
  baseValueInCents: number
  numberOfEnrollments: number
}

export type ICreatePersonalMonth = {
  month: number
  education: string
  employmentRelationship: string // 'CLT' | 'PJ'
  numberOfFinancialDirectors: number
  salaryInCents: number
  salaryAdjustment: number
  inssEmployer: number
  inss: number
  fgtsCharges: number
  pisCharges: number
  transportationVouchersInCents: number
  foodVoucherInCents: number
  healthInsuranceInCents: number
  lifeInsuranceInCents: number
  holidaysAndChargesInCents: number
  allowanceInCents: number
  thirteenthInCents: number
  fgtsInCents: number
}

export type ICreateLogisticMonth = {
  month: number
  accommodationInCents: number
  foodInCents: number
  transportInCents: number
  carAndFuelInCents: number
  airfareInCents: number
  numberOfPeople: number
  dailyAccommodation: number
  dailyFood: number
  dailyTransport: number
  dailyCarAndFuel: number
  totalTrips: number
}

export type ICreateIpca = {
  budgetId: number
  costCenterSubCategoryId: number
  months: ICreateIpcaMonth[]
}

export type ICreateCaed = {
  budgetId: number
  costCenterSubCategoryId: number
  months: ICreateCaedMonth[]
}

export type ICreatePersonal = {
  budgetId: number
  costCenterSubCategoryId: number
  months: ICreatePersonalMonth[]
}

export type ICreateLogistic = {
  budgetId: number
  costCenterSubCategoryId: number
  months: ICreateLogisticMonth[]
}

export type IGetAllResultsByBudget = {
  budgetId: number
  subCategoryId: number | undefined
  enabled?: boolean
}

export type IGetLogisticExpenses = {
  budgetId: number
  categoryId: number | undefined
  enabled?: boolean
}

export async function createIpca(data: ICreateIpca) {
  const response = await api
    .post(`/budget-results/ipca`, data)
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

export async function createCaed(data: ICreateCaed) {
  const response = await api
    .post(`/budget-results/caed`, data)
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

export async function createPersonal(data: ICreatePersonal) {
  const response = await api
    .post(`/budget-results/personal-expenses`, data)
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

export async function createLogistic(data: ICreateLogistic) {
  const response = await api
    .post(`/budget-results/logistics-expenses`, data)
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

export async function deleteResults(id: number) {
  const response = await api
    .delete(`/budget-results/${id}`)
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

export function useGetAllResultsByBudget(params: IGetAllResultsByBudget) {
  const { data, isLoading } = useQuery({
    queryKey: ['results_by_id', params],
    queryFn: async () => {
      const resp = await api
        .get(
          `/budget-results/all-by-budget-and-sub-category/${params?.budgetId}/${params?.subCategoryId}`,
        )
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

export async function getAllResultsLastYear(params: IGetAllResultsByBudget) {
  const response = await api
    .get(`/budget-results/all-last-year/${params?.budgetId}/${params?.subCategoryId}`)
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

export function useGetAllResultsLastYear(params: IGetAllResultsByBudget) {
  const { data, isLoading } = useQuery({
    queryKey: ['results_last_year', params],
    queryFn: async () => {
      const resp = await api
        .get(`/budget-results/all-last-year/${params?.budgetId}/${params?.subCategoryId}`)
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
    enabled: params.enabled,
  })

  return {
    data,
    isLoading,
  }
}

export function useGetLogisticExpenses(params: IGetLogisticExpenses) {
  const { data, isLoading } = useQuery({
    queryKey: ['logistic_expenses', params],
    queryFn: async () => {
      const resp = await api
        .get(`/budget-results/logistics-expenses/${params?.budgetId}/${params?.categoryId}`)
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
    enabled: params.enabled,
  })

  return {
    data,
    isLoading,
  }
}
