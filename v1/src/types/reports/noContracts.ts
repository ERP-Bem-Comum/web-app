import { filterReportParams, FormParamsReturn } from './filters'

export type NoContractsBudgetPlan = {
  id: number | string
  name: string
  total: number
}

export type NoContractsData = {
  id: number | string
  name: string
  total: number
  budgetPlan: NoContractsBudgetPlan[]
}

export interface useNoContractsReturn {
  data?: Array<NoContractsData>
  isLoading: boolean
  form: FormParamsReturn<filterReportParams>
}
