import { supplierSchema } from '@/validators/supplier'
import { z } from 'zod'
import { ContractForAccounts } from './contracts'

export type Supplier = z.input<typeof supplierSchema>

export type ICreateSupplier = {
  name: string
  email: string
  cnpj: string
  corporateName: string
  fantasyName: string
  serviceCategory: string
  serviceEvaluation?: number | null
  commentEvaluation?: string | null
}

export type ISupplier = {
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
  bancaryInfo:
    | {
        bank: string
        agency: string
        accountNumber: string
        dv: string
      }
    | undefined
  pixInfo:
    | {
        key_type: string
        key: string
      }
    | undefined
  contracts?: ContractForAccounts[]
}

export type IGetSupplier = {
  page: number
  limit: number
  search?: string
  active?: number | null
  categories?: string[]
}
