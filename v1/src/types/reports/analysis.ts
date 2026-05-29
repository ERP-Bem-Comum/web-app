import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query'
import { filterReportParams, FormParamsReturn } from './filters'
import { Response } from '../global'

type DefaultField = {
  id: number
  name: string
  total: number
}

type Item = {
  monthYear: string
  total: number
}

export type AnalysisCostCenter = DefaultField & {
  itens: Item[]
}

export type AnalysisData = {
  id: number
  name: string
  total: number
  itens: Item[]
  CostCenter: AnalysisCostCenter[]
}

export type AnalysisReportData = {
  totalValueOfPeriod: number
  data: AnalysisData[]
}

export type FinancierChart = {
  id: number
  name: string
  total: number
}

export interface useAnalysisReturn {
  data?: AnalysisReportData
  isLoading: boolean
  form: FormParamsReturn<filterReportParams>
}
