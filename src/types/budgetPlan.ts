import { BudgetPlanStatus } from '@/enums/budgetPlan'
import { IBudget } from '@/services/budget'
import { IUser } from '@/services/user'
import { ICostCenter } from './costCenter'
import { PaginateParams } from './paginateParams'

export type IBudgetPlan = {
  id: number
  name: string
  email: string
  cnpj: string
  corporateName: string
  fantasyName: string
  serviceCategory: string
  serviceEvaluation: number
  commentEvaluation: string
  active: boolean
  status: BudgetPlanStatus
}

export type BudgetPlan = {
  id: number
  year: number
  scenarioName: string
  version: number
  totalInCents: number
  status: BudgetPlanStatus
  programId: number
  updatedBy: IUser
  costCenters: ICostCenter[]
  budgets: IBudget[]
  parent: BudgetPlan
  children: BudgetPlan[]
}

export type DataForInsights = {
  id: number
  year: number
  totalInCents: number
  differenceValueInPercentage: number
  countPartnerMunicipalities: number
  countPartnerStates: number
  medInCentsForPartners: number
  type: string
}

export type ICreateBudgetPlan = {
  year: number
  yearForImport?: number | null | undefined
  programId: number | null
}

export type ICreateScenery = {
  name: string
  budgetPlanId: number
}

export type IBudgetPlanTable = {
  id: number
  children: IBudgetPlanTable[]
  scenarioName?: string
  program: { name: string }
  status: string
  totalInCents: number
  countPartnerMunicipalities: number
  countPartnerStates: number
  updatedAt: Date
  updatedBy: { name: string }
  version: number
  year: number
}

export type ICheckCredentialsBudgetPlan = {
  budgetPlanId: number
  password: string
}

export type IGetConsolidated = {
  year: number
  programId: number | null
  status?: string
}

export interface IGetBudgetPlan extends PaginateParams {
  year?: number | null
  programId?: number | null | undefined
  status?: string | null
}

export interface BudgetPlanOptions {
  id: number
  scenarioName: string
}
