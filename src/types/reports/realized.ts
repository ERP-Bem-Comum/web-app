import { realizedFilterSchema } from '@/validators/reports/realizedFilters'
import { z } from 'zod'
import { Control, FieldErrors, UseFormWatch } from 'react-hook-form'

export type FilterRealizedReportParams = z.infer<typeof realizedFilterSchema>

export type FormRealizedParamsReturn = {
  control: Control<FilterRealizedReportParams>
  watch: UseFormWatch<FilterRealizedReportParams>
  errors: FieldErrors<FilterRealizedReportParams>
  values: FilterRealizedReportParams
  handleFilter: () => void
  clearField: (field: keyof FilterRealizedReportParams) => void
}

export type useReportFilterReturn = FormRealizedParamsReturn

export interface Month {
  month: number
  expected: number
  realized: number
  provisioned: number
}

export interface SubCategory {
  totalExpected: number
  totalRealized: number
  totalProvisioned: number
  id: number
  name: string
  months: Month[]
}

export interface Category {
  totalExpected: number
  totalRealized: number
  totalProvisioned: number
  id: number
  name: string
  months: Month[]
  subCategories: SubCategory[]
}

export type CostCenterData = {
  id: number
  name: string
  totalExpected: number
  totalRealized: number
  totalProvisioned: number
  budgetPlanId: number
  categories: Category[]
}

export interface RealizedExpectedData {
  totalExpected: number
  totalRealized: number
  totalProvisioned: number
  costCenters: CostCenterData[]
}

export interface useRealizedReturn {
  data?: RealizedExpectedData
  isLoading: boolean
  form: FormRealizedParamsReturn
}
