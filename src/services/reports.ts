import { AccountsPosition, AccountsPositionType } from '@/types/reports/accountsPosition'
import { filterReportParams, filterReportParamsWithColumns } from '@/types/reports/filters'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from './api'
import { Response } from '@/types/global'
import { handleError } from '@/utils/errorHandling'
import { CashFlowData, CashFlowDataForChart } from '@/types/reports/cashFlow'
import { NoContractsData } from '@/types/reports/noContracts'
import { flattenParams } from '@/utils/flattenParams'
import { AnalysisReportData, FinancierChart } from '@/types/reports/analysis'
import { FilterRealizedReportParams, RealizedExpectedData } from '@/types/reports/realized'
import { GeneralReportData } from '@/types/reports/generalReport'
import { IGetCollaborator } from './collaborator'
import { CollaboratorData } from '@/types/reports/team'

const positionReportEndpoints: Record<AccountsPositionType, string> = {
  payable: '/reports/position/payables',
  receivable: '/reports/position/receivables',
}
export const useGetAccountsPosition = (params: filterReportParams, type: AccountsPositionType) => {
  const { paginationParams, reportsParams } = params
  const { isLoading: isLoadingAccountsPosition, data: accountsPosition } = useQuery({
    queryKey: ['report-position', type, paginationParams, reportsParams],
    queryFn: () => getAppointments(params, type),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    throwOnError: true,
  })

  return {
    isLoadingAccountsPosition,
    accountsPosition,
  }
}

const getAppointments = async (
  params: filterReportParams,
  type: AccountsPositionType,
): Promise<Response<AccountsPosition>> => {
  try {
    const endpoint = positionReportEndpoints[type]
    const resp = await api.get(endpoint, {
      params: flattenParams(params),
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    return handleError<AccountsPosition>(error)
  }
}
export const useGetCashFlow = (params: filterReportParams) => {
  const { paginationParams, reportsParams } = params

  const { isLoading: isLoadingCashFlow, data: cashFlow } = useQuery({
    queryKey: ['cashFlow', paginationParams, reportsParams],
    queryFn: () => getCashFlow(params),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    throwOnError: true,
  })

  return {
    isLoadingCashFlow,
    cashFlow,
  }
}

const getCashFlow = async (params: filterReportParams): Promise<Response<CashFlowData>> => {
  try {
    const resp = await api.get('reports/cashflow', {
      params: flattenParams(params),
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    return handleError<CashFlowData>(error)
  }
}

export const useGetCashFlowChart = (params: filterReportParams) => {
  const { reportsParams } = params
  const { isLoading: isLoadingChartData, data: chartData } = useQuery({
    queryKey: ['cashFlowChart', reportsParams],
    queryFn: () => getCashFlowChart(params),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    throwOnError: true,
  })

  return {
    isLoadingChartData,
    chartData,
  }
}

const getCashFlowChart = async (
  params: filterReportParams,
): Promise<Response<CashFlowDataForChart>> => {
  try {
    const resp = await api.get('reports/cashflow/chart', {
      params: params.reportsParams,
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    return handleError<CashFlowDataForChart>(error)
  }
}

export const useGetNoContractsReport = (params: filterReportParams) => {
  const { paginationParams, reportsParams } = params
  const { isLoading, data } = useQuery({
    queryKey: ['noContractsReport', paginationParams, reportsParams],
    queryFn: () => getNoContractsReport(params),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    throwOnError: true,
  })

  return {
    isLoading,
    data,
  }
}

const getNoContractsReport = async (
  params: filterReportParams,
): Promise<Response<Array<NoContractsData>>> => {
  try {
    const resp = await api.get('reports/noContract', {
      params: flattenParams(params),
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    return handleError<Array<NoContractsData>>(error)
  }
}

const getAnalysis = async (
  params: filterReportParams,
  type: AccountsPositionType,
): Promise<Response<AnalysisReportData>> => {
  const analysisReportEndpoints: Record<AccountsPositionType, string> = {
    payable: '/reports/analysis/payables',
    receivable: '/reports/analysis/receivables',
  }
  try {
    const endpoint = analysisReportEndpoints[type]

    const resp = await api.get<AnalysisReportData>(endpoint, {
      params: flattenParams(params),
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<AnalysisReportData>(error)
  }
}

const getFinanciersChart = async (): Promise<Response<FinancierChart[]>> => {
  try {
    const resp = await api.get<FinancierChart[]>('/reports/analysis/chart')

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<FinancierChart[]>(error)
  }
}

const getRealized = async (
  params: FilterRealizedReportParams,
): Promise<Response<RealizedExpectedData>> => {
  try {
    const resp = await api.get<RealizedExpectedData>('/reports/realized', {
      params,
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<RealizedExpectedData>(error)
  }
}

export const useGetGeneralReport = (params: filterReportParamsWithColumns) => {
  const { paginationParams, reportsParams, columns } = params
  const { isLoading, data } = useQuery({
    queryKey: ['GeneralReport', paginationParams, reportsParams, columns],
    queryFn: () => getGeneralReport(params),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    throwOnError: true,
  })

  return {
    isLoading,
    data,
  }
}

const getGeneralReport = async (
  params: filterReportParams,
): Promise<Response<Array<GeneralReportData>>> => {
  try {
    const resp = await api.get('reports/generalReport', {
      params: flattenParams(params),
    })

    return {
      status: resp.status,
      data: resp.data.data,
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    return handleError<Array<GeneralReportData>>(error)
  }
}

export async function getCashFlowCSV(params: filterReportParams): Promise<Response<Blob>> {
  try {
    const resp = await api.get<Blob>('reports/cashflow/csv', {
      params: flattenParams(params),
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}

export const getPositionCSV = async (
  params: filterReportParams,
  type: AccountsPositionType,
): Promise<Response<Blob>> => {
  try {
    const flattenedParams = flattenParams(params)
    const resp = await api.get<Blob>('reports/position/csv', {
      params: { flattenedParams, tipo: type === 'payable' ? 'p' : 'r' },
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}

export const getNoContractsCSV = async (params: filterReportParams): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('reports/noContract/csv', {
      params: flattenParams(params),
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}

export const getAnalysisCSV = async (
  params: filterReportParams,
  type: AccountsPositionType,
): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('reports/analysis/csv', {
      params: { ...flattenParams(params), tipo: type === 'payable' ? 'p' : 'r' },
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}

export const useGetAnalysisReport = (
  { paginationParams, reportsParams }: filterReportParams,
  type: AccountsPositionType,
) => {
  const { isLoading, data, refetch } = useQuery({
    queryKey: ['analysis-position', type, reportsParams],
    queryFn: () => getAnalysis({ paginationParams, reportsParams }, type),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    throwOnError: true,
  })

  return {
    data,
    isLoading,
    refetch,
  }
}

export const useGetFinanciersChart = () => {
  const { isLoading, data, refetch } = useQuery({
    queryKey: ['financiers-chart'],
    queryFn: () => getFinanciersChart(),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    throwOnError: true,
  })

  return {
    data,
    isLoading,
    refetch,
  }
}

export const useGetRealizedReport = (params: FilterRealizedReportParams) => {
  const { isLoading, data, refetch } = useQuery({
    queryKey: ['realized-report', params],
    queryFn: () => getRealized(params),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    throwOnError: true,
  })

  return {
    data,
    isLoading,
    refetch,
  }
}

export const getRealizedReportCSV = async (
  params: FilterRealizedReportParams,
): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('reports/realized/csv', {
      params: {
        ...params,
        formatValues: true, // Indica para a API que os valores devem ser formatados
      },
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}

export const getGeneralsCSV = async (
  params: filterReportParamsWithColumns,
): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('reports/general/csv', {
      params: flattenParams(params),
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}

interface TeamReportResponse {
  items: CollaboratorData[]
  meta?: {
    totalItems: number
    currentPage: number
    totalPages: number
    itemsPerPage: number
  }
}

export function useGetTeamReport(params: IGetCollaborator) {
  const { data, isLoading } = useQuery({
    queryKey: ['team-report', params],
    queryFn: async () => {
      const resp = await api
        .get<TeamReportResponse>(`/reports/team`, {
          params,
        })
        .then((response) => {
          return response
        })
        .catch((error) => {
          console.error(error)
          return handleError<TeamReportResponse>(error)
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

export const getRealizedReportPDF = async (
  params: FilterRealizedReportParams,
): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('reports/pdf/realized', {
      params: {
        ...params,
        formatValues: true, // Indica para a API que os valores devem ser formatados
      },
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}

export const getGeneralsPDF = async (
  params: filterReportParamsWithColumns,
): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('reports/pdf/general', {
      params: flattenParams(params),
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}

export async function getCashFlowPDF(params: filterReportParams): Promise<Response<Blob>> {
  try {
    const resp = await api.get<Blob>('reports/pdf/cashflow', {
      params: flattenParams(params),
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}

export const getPositionPDF = async (
  params: filterReportParams,
  type: AccountsPositionType,
): Promise<Response<Blob>> => {
  try {
    const flattenedParams = flattenParams(params)
    const resp = await api.get<Blob>('reports/pdf/position', {
      params: { flattenedParams, type: type === 'payable' ? 'p' : 'r' },
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}

export const getNoContractsPDF = async (params: filterReportParams): Promise<Response<Blob>> => {
  try {
    const resp = await api.get<Blob>('reports/pdf/nocontracts', {
      params: flattenParams(params),
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}

export const getAnalysisPDF = async (
  params: filterReportParams,
  type: AccountsPositionType,
): Promise<Response<Blob>> => {
  try {
    const flattenedParams = flattenParams(params)

    const resp = await api.get<Blob>('reports/pdf/analysis', {
      params: { flattenedParams, type: type === 'payable' ? 'p' : 'r' },
      responseType: 'blob',
    })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    return handleError<Blob>(error)
  }
}
