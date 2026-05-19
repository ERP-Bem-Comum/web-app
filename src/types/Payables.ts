import { CustomFile } from '@/components/files/fileItem'
import { DebtorType, PayableStatus, PaymentType, RecurenceType } from './../enums/payables'
import { useDisclosure } from '@/hooks/useDisclosure'
import { ICollaborator } from '@/services/collaborator'
import { IProgram } from '@/services/programs'
import { filterSchema, payableSchema } from '@/validators/payables'
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
import { ISupplier } from './supplier'
import { Dispatch, SetStateAction } from 'react'
import { IUser } from '@/services/user'

export type ParamsPayables = {
  paginationParams: PaginateParams
  search: string
  payableParams: z.infer<typeof filterSchema>
}

export type ParamsPayablesApproval = {
  paginationParams: PaginateParams
  userId: number
}

export type Payable = z.infer<typeof payableSchema>

export type IPayables = Payable &
  abstractType & {
    id: number
    supplier: ISupplier
    collaborator: ICollaborator
    payableStatus: PayableStatus
    totalValue: number
    approvers: number[]
    recurenceData:
      | {
          recurrenceType: RecurenceType | undefined
          startDate: Date | undefined
          endDate: Date | undefined
          dueDay: number | undefined
        }
      | undefined
    files: {
      id: number
      fileUrl: string
    }[]
    approvals: {
      id: number
      approved: boolean
      obs: string
      collaborator: Pick<ICollaborator, 'id' | 'name' | 'email'>
      user: Pick<IUser, 'id' | 'email' | 'name'>
    }[]
    categorization: {
      program: Pick<IProgram, 'id' | 'name'>
      budgetPlan: Pick<BudgetPlan, 'id' | 'year' | 'scenarioName' | 'version'>
      costCenter: Pick<ICostCenter, 'id' | 'name' | 'active'>
      costCenterCategory: Pick<ICostCenterCategory, 'id' | 'name' | 'active'>
      costCenterSubCategory: Pick<ICostCenterSubCategory, 'id' | 'name' | 'type'>
    }
    installments: Installments[]
    contract: IContract
    createdAt: string
    updatedAt: string
  }

export type PayableRow = abstractType & {
  obs: string | null
  paymentType: PaymentType
  debtorType: DebtorType
  competenceDate: string
  contract: Pick<
    IContract,
    | 'id'
    | 'bancaryInfo'
    | 'pixInfo'
    | 'budgetPlan'
    | 'collaborator'
    | 'financier'
    | 'createdAt'
    | 'object'
    | 'contractPeriod'
    | 'supplier'
    | 'agreement'
  > & {
    contractCode: string
  }
  approvals: {
    id: number
  }[]
  totalValue: number
  payableStatus: PayableStatus
  supplier: Pick<ISupplier, 'id' | 'name'>
  collaborator: Pick<ICollaborator, 'id' | 'name'>
  installments: Installments[]
  categorization: {
    costCenter: Pick<ICostCenter, 'id' | 'name'>
    costCenterCategory: Pick<ICostCenterCategory, 'id' | 'name'>
    costCenterSubCategory: Pick<ICostCenterSubCategory, 'id' | 'name'>
  }
}

export interface IEditPayable extends Payable {
  id: number
  payableStatus: PayableStatus
  currentFiles: CustomFile[]
  supplier: ISupplier
  collaborator: ICollaborator
  contract: ContractForAccounts
}

export interface payablesContextProps {
  payable?: IPayables
  success: boolean
  errorMessage: string
  isLoading: boolean
  operationType: 'create' | 'edit' | 'delete' | null
  setCurrentPayableId: (id: number) => void
  onDelete: (id: number | undefined) => Promise<void>
  onSubmit: SubmitHandler<Payable>
  onUpdateCategory: SubmitHandler<Payable>
  handleChangeFile: (attachments: Array<CustomFile> | null) => void
  setErrorMessage: Dispatch<SetStateAction<string>>
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
