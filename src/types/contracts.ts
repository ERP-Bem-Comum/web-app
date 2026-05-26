import { CustomFile } from '@/components/files/InputFIleV2'
import { ContractStatus } from '@/enums/contracts'
import { PaymentType } from '@/enums/payables'
import { ReceivableType } from '@/enums/receivables'
import { ICollaborator } from '@/services/collaborator'
import { IFinancier } from '@/services/financier'
import { IUser } from '@/services/user'
import {
  contractSchema,
  defaultFullContractSchema,
  filterContractsSchema,
} from '@/validators/contracts'
import { z } from 'zod/v3'
import { ActionTypes } from './../enums/historys'
import { BudgetPlan } from './budgetPlan'
import { abstractType } from './global'
import { Installments } from './installments'
import { PaginateParams } from './paginateParams'
import { IPayables } from './Payables'
import { IReceivable } from './receivables'
import { ISupplier } from './supplier'
import { IProgram } from '@/services/programs'

export type ParamsContracts = {
  paginationParams: PaginateParams
  search: string
  payableParams: z.infer<typeof filterContractsSchema>
}

export type Contract = z.input<typeof contractSchema>

export type otherContractSchema = z.infer<typeof defaultFullContractSchema>

export type IContract = Omit<
  Contract,
  'supplierId' | 'financierId' | 'collaboratorId' | 'budgetPlanId'
> &
  abstractType &
  Pick<otherContractSchema, 'pixInfo' | 'bancaryInfo'> & {
    supplier: Pick<
      ISupplier,
      'name' | 'id' | 'cnpj' | 'serviceCategory' | 'fantasyName' | 'bancaryInfo' | 'pixInfo'
    >
    financier: Pick<IFinancier, 'id' | 'name' | 'cnpj' | 'corporateName' | 'address' | 'telephone'>
    program: Pick<IProgram, 'id' | 'name'>
    collaborator: Pick<ICollaborator, 'id' | 'cpf' | 'name' | 'email' | 'role'>
    budgetPlan: Pick<BudgetPlan, 'id' | 'scenarioName' | 'year' | 'version'>
    contractStatus: ContractStatus
    files: {
      id: number
      fileUrl: string
    }[]
    payable: Pick<IPayables, 'id'>
    receivable: Pick<IReceivable, 'id'>
    currentFiles: CustomFile[]
    contractCode: string
    withdrawalUrl: string
    settleTermUrl: string
    signedContractUrl: string
    children?: IContract[]
    /** Tipo do aditivo: prazo | valor | escopo | outro | distrato */
    aditivoType?: 'prazo' | 'valor' | 'escopo' | 'outro' | 'distrato'
    /** Status do aditivo: Rascunho | Pendente | Homologado */
    aditivoStatus?: 'Rascunho' | 'Pendente' | 'Homologado'
    /** Data da assinatura do aditivo (dd/mm/aaaa) */
    dataAssinatura?: string
    /** Observações gerais / notas internas do contrato */
    observations?: string
    /** Categorização do contrato */
    categorizacao?: string[]
    /** Centro de custo do contrato */
    centroDeCusto?: string[]
  }

export type Children = abstractType &
  Pick<Contract, 'contractType' | 'object' | 'contractPeriod' | 'totalValue' | 'contractModel'> & {
    contractCode: string
    supplier: Pick<ISupplier, 'id' | 'name' | 'cnpj' | 'corporateName'> | null
    financier: Pick<IFinancier, 'id' | 'name' | 'cnpj' | 'corporateName'> | null
    program: Pick<IFinancier, 'id' | 'name'>
    collaborator: Pick<ICollaborator, 'id' | 'name' | 'cpf'> | null
    budgetPlan: Pick<BudgetPlan, 'id' | 'scenarioName' | 'year' | 'version'>
    contractStatus: ContractStatus
    withdrawalUrl: string
    settleTermUrl: string
    signedContractUrl: string
    parentId?: number
    pending: number
    /** Valor pago/executado para cálculo de saldo */
    paidValue?: number
    /** Tipo do aditivo: prazo | valor | escopo | outro | distrato */
    aditivoType?: 'prazo' | 'valor' | 'escopo' | 'outro' | 'distrato'
    /** Status do aditivo: Rascunho | Pendente | Homologado */
    aditivoStatus?: 'Rascunho' | 'Pendente' | 'Homologado'
    /** Data da assinatura do aditivo (dd/mm/aaaa) */
    dataAssinatura?: string
    /** Observações gerais / notas internas do contrato */
    observations?: string
  }

export type ContractRow = Omit<Children, 'parentId'> & {
  children?: Children[] | null
}

export type ContractPaymentHistory = {
  id: number
  contractCode: string
  payable: {
    id: number
    paymentType: PaymentType
    installments: Installments[]
  }[]
  receivable: {
    id: number
    receivableType: ReceivableType
    installments: Installments[]
  }[]
  historys: {
    id: number
    actionType: ActionTypes
    user: Pick<IUser, 'id' | 'name' | 'email'>
    createdAt: string
    updatedAt: string
  }[]
}

export type ContractForAccounts = Pick<
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
  | 'totalValue'
  | 'program'
> & {
  contractCode: string
}
