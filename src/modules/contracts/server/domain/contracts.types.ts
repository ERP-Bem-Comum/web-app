/**
 * Tipos do domínio de contratos (server-side) — PUROS, sem Zod (C2 do review: domínio não depende
 * de framework de validação). Os schemas Zod correspondentes vivem em `../adapters/contracts.schemas.ts`
 * (a borda), que mantém guards de drift contra estes tipos. Definidos no server p/ evitar import
 * circular client→server.
 *
 * Nota: a forma destes tipos espelha EXATAMENTE a saída dos schemas (antes inferida via `z.infer`),
 * para não regredir os consumidores — daí não serem `readonly` (o client-model correspondente também
 * não é). Imutabilidade reforçada é tratada separadamente, fora do escopo deste achado.
 */

// ContractsError — FONTE ÚNICA (A2) da união discriminada de falhas do domínio de contratos.
// Vive no domínio (puro); adapters e client-data REEXPORTAM daqui (boundary: domain não importa nada
// de fora). Antes havia 3 cópias divergentes (domain/errors, adapters/shared, client/repository).
export type ContractsError =
  | 'invalid-code'           // código/sequentialNumber inválido
  | 'invalid-value'          // valor <= 0 ou teto de OS excedido
  | 'invalid-period'         // período de vigência inválido
  | 'missing-contractor'     // contratante obrigatório não informado
  | 'contract-not-found'     // 404
  | 'amendment-not-found'    // 404 aditivo
  | 'invalid-amendment-type' // tipo de aditivo inválido
  | 'connectivity'           // backend fora / timeout
  | 'server'                 // 5xx / inesperado
  | 'unauthorized'           // 401 / 403
  | 'not-implemented'        // operação ainda não existe no core-api (sem rota)
  | 'invalid-pdf'            // arquivo não é PDF assinado válido (magic bytes %PDF)
  | 'file-too-large'         // documento acima do limite (20 MiB)
  | 'invalid-signed-at'      // data de assinatura ausente/inválida/futura
  | 'no-signed-document'     // ativar sem documento assinado anexado
  | 'document-conflict'      // documento já anexado/substituído/removido ou de outro contrato
  | 'storage-unavailable'    // backend de objetos (MinIO/S3) indisponível

export type ContractClassification = 'Contract' | 'ServiceOrder'
export type ContractModel = 'Service' | 'Donation'
export type ContractType = 'Supplier' | 'Financier' | 'Collaborator' | 'ACT'
export type ContractStatus = 'Pendente' | 'Em Andamento' | 'Finalizado' | 'Distrato'
export type AmendmentType = 'prazo' | 'valor' | 'escopo' | 'outro' | 'distrato'
export type AmendmentStatus = 'Pendente' | 'Homologado'

export interface Money {
  cents: number
}

export interface Period {
  start: Date
  end: Date
}

export interface PartnerSnapshot {
  id: string
  name: string
  document: string
  email?: string
  telephone?: string
}

export interface BankInfo {
  bank: string
  agency: string
  accountNumber: string
  dv: string
  updatedAt: Date
}

export interface PixInfo {
  keyType: string
  key: string
  updatedAt: Date
}

export interface Amendment {
  id: string
  amendmentNumber: string
  type: AmendmentType
  description?: string
  impactValueCents?: number
  newEndDate?: Date
  startDate?: Date
  status: AmendmentStatus
  signedAt?: Date
  signedContractUrl?: string
  createdAt: Date
}

export interface ContractFile {
  id: string
  name: string
  url: string
  size?: number
  uploadedAt: Date
  uploadedBy?: string
}

export interface Contract {
  id: string
  sequentialNumber: string
  title: string
  objective: string
  originalValue: Money
  originalPeriod: Period
  status: ContractStatus
  signedAt: Date | null
  currentValue: Money
  currentPeriod: Period | null
  endedAt: Date | null
  classification: ContractClassification
  contractModel: ContractModel
  contractType: ContractType
  supplierId?: string
  financierId?: string
  collaboratorId?: string
  supplier?: PartnerSnapshot
  financier?: PartnerSnapshot
  collaborator?: PartnerSnapshot
  programId?: number
  program?: { id: number; name: string }
  budgetPlanId?: number
  budgetPlan?: { id: number; scenarioName: string; year: number; version: number }
  categorizacao?: 'Avaliação' | 'Operacional' | 'Processo'
  centroDeCusto?: 'RH' | 'Serviços Gerais' | 'Eventos'
  observations?: string
  email?: string
  telephone?: string
  bancaryInfo?: BankInfo
  pixInfo?: PixInfo
  origin?: string
  createdAt: Date
  updatedAt?: Date
  children: Amendment[]
  files: ContractFile[]
}

export interface ListContractsInput {
  page: number
  limit: number
  search?: string
  contractType?: ContractType
  status?: ContractStatus
  contractPeriodStart?: Date
  contractPeriodEnd?: Date
  minValue?: number
  maxValue?: number
  budgetPlanId?: number
  order: 'ASC' | 'DESC'
}

export interface CreateContractInput {
  title: string
  objective: string
  originalValueCents: number
  originalPeriod: Period
  classification: ContractClassification
  contractModel: ContractModel
  contractType: ContractType
  supplierId?: string
  financierId?: string
  collaboratorId?: string
  programId?: number
  budgetPlanId?: number
  categorizacao?: 'Avaliação' | 'Operacional' | 'Processo'
  centroDeCusto?: 'RH' | 'Serviços Gerais' | 'Eventos'
  observations?: string
  email?: string
  telephone?: string
  bancaryInfo?: { bank: string; agency: string; accountNumber: string; dv: string }
  pixInfo?: { keyType: string; key: string }
}

export interface AttachSignedDocumentInput {
  contractId: string
  fileBase64: string
  fileName: string
  signedAt: string
}

export interface AttachAmendmentDocumentInput {
  contractId: string
  amendmentId: string
  fileBase64: string
  fileName: string
  signedAt: string
}

export interface UpdateContractInput {
  id: string
  email?: string
  telephone?: string
  observations?: string
}

export interface CreateAmendmentInput {
  type: AmendmentType
  description?: string
  impactValueCents?: number
  newEndDate?: Date
  startDate?: Date
  signedAt?: Date
}

// ContractHistoryEvent — evento de auditoria do contrato (server-domain para evitar cross-layer import).
export type ContractHistoryEvent = Readonly<{
  eventId: string
  contractId: string
  kind: string
  description: string
  occurredAt: string
  userName?: string
  metadata?: Record<string, string | number | boolean | null>
}>

export interface ListContractsResponse {
  items: Contract[]
  meta: {
    page: number
    totalPages: number
    total: number
    limit: number
  }
}
