import type { Brand } from '#shared/primitives/brand.ts'

export type ContractId = Brand<string, 'ContractId'>
export const ContractId = (raw: string): ContractId => raw as ContractId

export type ContractCode = Brand<string, 'ContractCode'>

export type Money = Brand<number, 'Money'>

export const ContractClassification = {
  CONTRACT: 'Contrato',
  SERVICE_ORDER: 'Ordem de Serviço',
} as const
export type ContractClassification =
  (typeof ContractClassification)[keyof typeof ContractClassification]

export const ContractType = {
  SUPPLIER: 'Fornecedor',
  FINANCIER: 'Financiador',
  COLLABORATOR: 'Colaborador',
  ACT: 'ACT',
} as const
export type ContractType =
  (typeof ContractType)[keyof typeof ContractType]

export const ContractModel = {
  SERVICE: 'Serviço',
  DONATION: 'Doação',
} as const
export type ContractModel =
  (typeof ContractModel)[keyof typeof ContractModel]

export const ContractStatus = {
  PENDING: 'Pendente',
  ACTIVE: 'Em Andamento',
  EXPIRED: 'Finalizado',
  TERMINATED: 'Distrato',
} as const
export type ContractStatus =
  (typeof ContractStatus)[keyof typeof ContractStatus]

export const AditivoStatus = {
  // RASCUNHO removed per spec §1 / P.O. decision 2026-06-02
  PENDENTE: 'Pendente',
  HOMOLOGADO: 'Homologado',
} as const
export type AditivoStatus =
  (typeof AditivoStatus)[keyof typeof AditivoStatus]

export const AditivoType = {
  PRAZO: 'prazo',
  VALOR: 'valor',
  ESCOPO: 'escopo',
  OUTRO: 'outro',
  DISTRATO: 'distrato',
} as const
export type AditivoType =
  (typeof AditivoType)[keyof typeof AditivoType]

export const Categoria = {
  AVALIACAO: 'Avaliação',
  OPERACIONAL: 'Operacional',
  PROCESSO: 'Processo',
} as const
export type Categoria =
  (typeof Categoria)[keyof typeof Categoria]

export const CentroDeCusto = {
  RH: 'RH',
  SERVICOS_GERAIS: 'Serviços Gerais',
  EVENTOS: 'Eventos',
} as const
export type CentroDeCusto =
  (typeof CentroDeCusto)[keyof typeof CentroDeCusto]

export interface ContractPeriod {
  readonly start: Date
  readonly end: Date
  readonly isIndefinite?: boolean
}

export interface OriginalContractPeriod {
  readonly start: string
  readonly end: string
  readonly isIndefinite?: boolean
}

export interface BancaryInfo {
  readonly bank?: string | null
  readonly agency?: string | null
  readonly accountNumber?: string | null
  readonly dv?: string | null
}

export interface PixInfo {
  readonly key_type?: string | null
  readonly key?: string | null
}

export interface Contractor {
  readonly id?: string | null
  readonly name?: string | null
  readonly email?: string | null
  readonly telephone?: string | null
  readonly cnpj?: string | null
  readonly cpf?: string | null
  readonly corporateName?: string | null
  readonly fantasyName?: string | null
  readonly serviceCategory?: string | null
  readonly role?: string | null
  readonly address?: string | null
  readonly bancaryInfo?: BancaryInfo | null
  readonly pixInfo?: PixInfo | null
}

export interface FileAttachment {
  readonly id: string
  readonly fileUrl: string
}

export interface ProgramRef {
  readonly id: string
  readonly name: string
}

export interface BudgetPlanRef {
  readonly id: string
  readonly scenarioName: string
  readonly year: number
  readonly version: number
}

export interface Contract {
  readonly id: ContractId
  readonly classification: ContractClassification
  readonly contractModel: ContractModel
  readonly object: string
  readonly totalValue: Money
  readonly contractPeriod: ContractPeriod
  readonly contractType: ContractType
  readonly supplierId?: string | null
  readonly financierId?: string | null
  readonly collaboratorId?: string | null
  readonly budgetPlanId?: string | null
  readonly programId?: string | null
  readonly supplier?: Contractor | null
  readonly financier?: Contractor | null
  readonly collaborator?: Contractor | null
  readonly program?: ProgramRef | null
  readonly budgetPlan?: BudgetPlanRef | null
  readonly contractStatus: ContractStatus
  readonly backendStatus?: string | null
  readonly contractCode: ContractCode
  readonly files: readonly FileAttachment[]
  readonly children?: readonly Contract[]
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly originalContractPeriod?: ContractPeriod | null
  readonly categorizacao?: string | null
  readonly centroDeCusto?: string | null
  readonly email?: string | null
  readonly telephone?: string | null
  readonly observations?: string | null
  readonly dataAssinatura?: string | null
  readonly signedContractUrl?: string | null
  readonly origin?: string | null
  readonly bancaryInfo?: BancaryInfo | null
  readonly pixInfo?: PixInfo | null
}

export interface ContractRow extends Omit<Contract, 'children'> {
  readonly children?: readonly Contract[] | null
  readonly childrenCount?: number
  readonly currentValue?: number
}

export interface ContractListFilters {
  readonly page?: number
  readonly limit?: number
  readonly search?: string
  readonly budgetPlanId?: string | null
  readonly contractPeriodStart?: string
  readonly contractPeriodEnd?: string
  readonly contractType?: ContractType
  readonly contractStatus?: ContractStatus
  readonly order?: 'ASC' | 'DESC'
}

export interface PaginatedContractRows {
  readonly items: readonly ContractRow[]
  readonly meta: {
    readonly itemCount: number
    readonly totalItems: number
    readonly itemsPerPage: number
    readonly totalPages: number
    readonly currentPage: number
  }
}

export function mapBackendStatus(backend: string): ContractStatus {
  switch (backend) {
    case 'Pending':
      return ContractStatus.PENDING
    case 'Active':
      return ContractStatus.ACTIVE
    case 'Expired':
      return ContractStatus.EXPIRED
    case 'Terminated':
      return ContractStatus.TERMINATED
    default:
      return ContractStatus.PENDING
  }
}
