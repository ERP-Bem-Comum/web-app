import { CustomFile } from '@/components/files/fileItem'
import { ReceivableStatus, ReceivableType } from '@/enums/receivables'
import { useDisclosure } from '@/hooks/useDisclosure'
import { IFinancier } from '@/services/financier'
import { IProgram } from '@/services/programs'
import { filterReceivableSchema, receivableSchema } from '@/validators/receivables'
import { SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { BudgetPlan } from './budgetPlan'
import { ICostCenterCategory } from './category'
import { ContractForAccounts, IContract } from './contracts'
import { ICostCenter } from './costCenter'
import { abstractType } from './global'
import { Installments } from './installments'
import { PaginateParams } from './paginateParams'
import { ICostCenterSubCategory } from './subCategory'

export type ParamsReceivables = {
  paginationParams: PaginateParams
  search: string
  receivableParams: z.infer<typeof filterReceivableSchema>
}

export type Receivable = z.infer<typeof receivableSchema>
export type IReceivable = Receivable &
  abstractType & {
    files: {
      id: number
      fileUrl: string
    }[]
    receivableStatus: ReceivableStatus
    financier: IFinancier
    categorization: {
      program: Pick<IProgram, 'id' | 'name' | 'abbreviation' | 'active'>
      budgetPlan: Pick<BudgetPlan, 'id' | 'year' | 'scenarioName' | 'version'>
      costCenter: Pick<ICostCenter, 'id' | 'name' | 'active'> | null
      costCenterCategory: Pick<ICostCenterCategory, 'id' | 'name' | 'active'> | null
      costCenterSubCategory: Pick<ICostCenterSubCategory, 'id' | 'name' | 'type'> | null
    }
    installments: Installments[]
    contract: IContract
  }

export type ReceivableRow = abstractType & {
  description: string | null
  receivableType: ReceivableType
  contract: string
  totalValue: number
  receivableStatus: ReceivableStatus
  financier: Pick<IFinancier, 'id' | 'name' | 'cnpj'>
  costCenter: Pick<ICostCenter, 'id' | 'name'>
  costCenterCategory: Pick<ICostCenterCategory, 'id' | 'name'>
  costCenterSubCategory: Pick<ICostCenterSubCategory, 'id' | 'name'>
  installments: Pick<Installments, 'id' | 'status'>[]
}
export interface IEditReceivable extends Receivable {
  id: number
  receivableStatus: ReceivableStatus
  currentFiles: CustomFile[]
  financier: IFinancier
  contract: ContractForAccounts
}

export interface ReceivablesContextProps {
  receivable: IReceivable | null
  success: boolean
  errorMessage: string
  setCurrentReceivableId: (id: number) => void
  onDelete: (id: number | undefined) => Promise<void>
  onSubmit: SubmitHandler<Receivable>
  onUpdateCategory: SubmitHandler<Receivable>
  handleChangeFile: (attachments: Array<CustomFile> | null) => void
  disclosure: {
    modalConfirmDisclosure: ReturnType<typeof useDisclosure>
    modalQuestionDisclosure: ReturnType<typeof useDisclosure>
    modalAlertDisclosure: ReturnType<typeof useDisclosure>
  }
  disabled: {
    isDisabled: boolean
    onDisable: () => void
    onEnable: () => void
  }
}
