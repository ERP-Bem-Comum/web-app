import { NoContractsData } from './reports/noContracts'

export type VariationSignal = '+' | '-'

type Expenses = {
  totalExpenses: number
  expensesVariation: string
  expensesVariationSignal: VariationSignal
}

type Revenue = {
  totalRevenue: number
  revenueVariation: string
  revenueVariationSignal: VariationSignal
}

type TopFinanciers = {
  nameTopFinancier: string
  totalTopFinanciers: string
  topFinanciersVariation: string
  topFinanciersVariationSignal: VariationSignal
}

type TopCostCenters = {
  nameTopCostCenter: string
  totalTopCostCentersExpenses: number
  topCostCentersVariation: string
  topCostCentersVariationExpensesSignal: VariationSignal
}

export type LastPayment = {
  name: string
  dueDate: string
  backAccount: string
  value: number
}

export type DashboardStatistics = Expenses &
  Revenue &
  TopFinanciers &
  TopCostCenters & {
    barChartCostCenterPayment: Array<{
      name: string
      percentage: number
    }>
    noContractSuppliers: Array<NoContractsData>
    lastPayments: Array<LastPayment>
    chartRealized: Array<{ month: string; expected: number; realized: number }>
  }
