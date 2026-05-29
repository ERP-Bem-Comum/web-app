import { filterReportParams, FormParamsReturn } from '@/types/reports/filters'
export interface defaultFields {
  id: number | string
  name: string
  totalPendente: number
  totalPago: number
  totalAtrasado: number
}

export type Category = defaultFields

export type CostCenter = defaultFields & {
  category: Category[]
}

export type AccountsPositionItem = defaultFields & {
  costCenter: CostCenter[]
}

export type AccountsPosition = {
  itens: Array<AccountsPositionItem>
  totalPendente: number
  totalPago: number
  totalAtrasado: number
}

export type AccountsPositionType = 'payable' | 'receivable'

export interface useAccountsPositionReturn {
  data?: AccountsPosition
  isLoading: boolean
  form: FormParamsReturn<filterReportParams>
}
