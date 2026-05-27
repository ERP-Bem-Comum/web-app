export type ContractId = number & { readonly __brand: 'ContractId' }
export const ContractId = (raw: number): ContractId => raw as ContractId

export type ContractCode = string & { readonly __brand: 'ContractCode' }

export type Money = number & { readonly __brand: 'Money' }

export enum ContractClassification {
  CONTRACT = 'Contrato',
  SERVICE_ORDER = 'Ordem de Serviço',
}

export enum ContractType {
  SUPPLIER = 'Fornecedor',
  FINANCIER = 'Financiador',
  COLLABORATOR = 'Colaborador',
  ACT = 'ACT',
}

export enum ContractModel {
  SERVICE = 'Serviço',
  DONATION = 'Doação',
}

export enum ContractStatus {
  PENDING = 'Pendente',
  SIGNED = 'Assinado',
  ONGOING = 'Em andamento',
  FINISHED = 'Finalizado',
  DISTRATO = 'Distrato',
}

export enum AditivoStatus {
  RASCUNHO = 'Rascunho',
  PENDENTE = 'Pendente',
  HOMOLOGADO = 'Homologado',
}

export enum AditivoType {
  PRAZO = 'prazo',
  VALOR = 'valor',
  ESCOPO = 'escopo',
  OUTRO = 'outro',
  DISTRATO = 'distrato',
}

export type ContractPeriod = {
  start: Date
  end: Date
  isIndefinite?: boolean
}

export type BancaryInfo = {
  bank?: string | null
  agency?: string | null
  accountNumber?: string | null
  dv?: string | null
}

export type PixInfo = {
  key_type?: string | null
  key?: string | null
}

export type Contractor = {
  id?: number | null
  name?: string | null
  email?: string | null
  telephone?: string | null
  cnpj?: string | null
  cpf?: string | null
  corporateName?: string | null
  fantasyName?: string | null
  serviceCategory?: string | null
  role?: string | null
  address?: string | null
  bancaryInfo?: BancaryInfo | null
  pixInfo?: PixInfo | null
}

export type FileAttachment = {
  id: number
  fileUrl: string
}

export type Contract = {
  id: ContractId
  classification: ContractClassification
  contractModel: ContractModel
  object: string
  totalValue: Money
  contractPeriod: ContractPeriod
  contractType: ContractType
  supplierId?: number | null
  financierId?: number | null
  collaboratorId?: number | null
  budgetPlanId?: number | null
  programId?: number | null
  supplier?: Contractor | null
  financier?: Contractor | null
  collaborator?: Contractor | null
  program?: { id: number; name: string } | null
  budgetPlan?: { id: number; scenarioName: string; year: number; version: number } | null
  contractStatus: ContractStatus
  contractCode: ContractCode
  files: FileAttachment[]
  children?: Contract[]
  createdAt: Date
  updatedAt: Date
}

export type ContractRow = Omit<Contract, 'children'> & {
  children?: Contract[] | null
}

export type ContractListFilters = {
  page?: number
  limit?: number
  search?: string
  budgetPlanId?: number | null
  contractPeriodStart?: string
  contractPeriodEnd?: string
  contractType?: ContractType
  contractStatus?: ContractStatus
  order?: 'ASC' | 'DESC'
}

export type PaginatedContractRows = {
  items: ContractRow[]
  meta: {
    itemCount: number
    totalItems: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}
