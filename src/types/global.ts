import { IProgram } from '@/services/programs'
import { bancaryInfoRefined, editPaymentInfoSchema, pixInfoRefined } from '@/validators/global'
import { z } from 'zod'
import { BudgetPlan } from './budgetPlan'
import { ICostCenter } from './costCenter'
import { ICostCenterCategory } from './category'
import { ICostCenterSubCategory } from './subCategory'
import { User } from 'next-auth'

export interface Options {
  id: number | string
  parentId?: number
  name: string
  user?: User
}

export type IPaginationMeta = {
  itemCount: number

  totalItems: number

  itemsPerPage: number

  totalPages: number

  currentPage: number
}

export type Response<T> = {
  status: number
  data?: T
  error: string
  meta: IPaginationMeta | null
}

export type HeadCell = {
  id: string
  label: string
  align: string
  sortable?: boolean
  onSort?: () => void
  selected?: boolean
  onSelect?: () => void
}

export type abstractType = {
  id: number
  createdAt: string
  updatedAt: string
}

export type EditPaymentInfo = z.infer<typeof editPaymentInfoSchema>

export type PixInfo = z.infer<typeof pixInfoRefined>
export type BancaryInfo = z.infer<typeof bancaryInfoRefined>

export type PaymentInfo = {
  pixInfo?: PixInfo
  bancaryInfo?: BancaryInfo
}

export type CategorizationInfo = {
  program: Pick<IProgram, 'id' | 'name' | 'abbreviation' | 'active'>
  budgetPlan: Pick<BudgetPlan, 'id' | 'year' | 'scenarioName' | 'version'>
  costCenter: Pick<ICostCenter, 'id' | 'name' | 'active'>
  costCenterCategory: Pick<ICostCenterCategory, 'id' | 'name' | 'active'>
  costCenterSubCategory: Pick<ICostCenterSubCategory, 'id' | 'name' | 'type'>
}
