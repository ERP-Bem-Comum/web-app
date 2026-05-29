import { filterReportParams, FormParamsReturn } from './filters'

export type CashFlowSubData = {
  Category_id: number
  Category_name: string
  SubCategory_id: number
  SubCategory_name: string
  REALIZED: number
  EXPECTED: number
}

export type CashFlowData = {
  Receivables: CashFlowSubData[]
  Payables: CashFlowSubData[]
}

export type CashFlowDataForChart = Array<CashFlowSubData & { Installments_dueDate: string }>

export type ChartCostCenter = {
  CostCenter_name: string
  REALIZED: number
  EXPECTED: number
}

export interface useCashFlowReturn {
  data?: CashFlowData
  isLoading: boolean
  chart: {
    data?: CashFlowDataForChart
    isLoading: boolean
  }
  form: FormParamsReturn<filterReportParams>
}
