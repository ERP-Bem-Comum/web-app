import { ICostCenterSubCategory } from './subCategory'

export type ICostCenterCategory = {
  id: number
  name: string
  costCenterId: number
  subCategories: ICostCenterSubCategory[]
  active: boolean
}

export type ICreateCostCenterCategory = {
  name: string
  costCenterId: number
}

export type IEditCostCenterCategory = {
  id: number
  name: string
  costCenterId: number
  active?: boolean
}
