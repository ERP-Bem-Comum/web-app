import { ICostCenterCategory } from './category'

export type ICostCenter = {
  id: number
  name: string
  budgetPlanId: number
  type: string
  categories: ICostCenterCategory[]
  active?: boolean
}

export type ICreateCostCenter = {
  name: string
  type: string
  budgetPlanId: number
}

export type IEditCostCenter = {
  id: number
  name: string
  type: string
  budgetPlanId: number
  active?: boolean
}
