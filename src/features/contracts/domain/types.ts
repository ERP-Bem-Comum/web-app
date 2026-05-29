export type ContractId = string & { readonly __brand: 'ContractId' }
export const ContractId = (raw: string): ContractId => raw as ContractId

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
  ACTIVE = 'Vigente',
  EXPIRED = 'Encerrado',
  TERMINATED = 'Distrato',
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

export enum Categoria {
  AVALIACAO = 'Avaliação',
  OPERACIONAL = 'Operacional',
  PROCESSO = 'Processo',
}

export enum CentroDeCusto {
  RH = 'RH',
  SERVICOS_GERAIS = 'Serviços Gerais',
  EVENTOS = 'Eventos',
}

export type ContractPeriod = {
  start: Date
  end: Date
  isIndefinite?: boolean
}

export type OriginalContractPeriod = {
  start: string
  end: string
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
  id?: string | null
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
  id: string
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
  supplierId?: string | null
  financierId?: string | null
  collaboratorId?: string | null
  budgetPlanId?: string | null
  programId?: string | null
  supplier?: Contractor | null
  financier?: Contractor | null
  collaborator?: Contractor | null
  program?: { id: string; name: string } | null
  budgetPlan?: { id: string; scenarioName: string; year: number; version: number } | null
  contractStatus: ContractStatus
  backendStatus?: string | null
  contractCode: ContractCode
  files: FileAttachment[]
  children?: Contract[]
  createdAt: Date
  updatedAt: Date
  // Campos adicionais presentes no mock/formulário
  originalContractPeriod?: ContractPeriod | null
  categorizacao?: string | null
  centroDeCusto?: string | null
  email?: string | null
  telephone?: string | null
  observations?: string | null
  dataAssinatura?: string | null
  signedContractUrl?: string | null
  origin?: string | null
  bancaryInfo?: BancaryInfo | null
  pixInfo?: PixInfo | null
}

export type ContractRow = Omit<Contract, 'children'> & {
  children?: Contract[] | null
  childrenCount?: number
}

export type ContractListFilters = {
  page?: number
  limit?: number
  search?: string
  budgetPlanId?: string | null
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
