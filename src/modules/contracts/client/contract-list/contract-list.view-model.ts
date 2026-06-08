/**
 * contractListViewModel — ViewModel AGNÓSTICO (objeto puro, zero React).
 * Define query options + derivações puras.
 */
import {
  STATUS_OPTIONS,
  deriveStatus,
  getMostRecentChild,
  programaShort,
} from '#modules/contracts/client/domain/status.ts'
import type { ContractRow, ContractStatus, ContractType } from '#modules/contracts/client/domain/types.ts'
import type {
  Contract as ContractModel,
  Amendment as AmendmentModel,
  ListContractsResponse,
} from '#modules/contracts/client/data/model/contracts.model.ts'

import { contractListQueryOptions } from './contract-list.query.ts'

const mapDocumentToCnpjCpf = (document: string | undefined): { cnpj?: string; cpf?: string } => {
  if (!document) return {}
  const digits = document.replace(/\D/g, '')
  if (digits.length === 14) return { cnpj: document }
  if (digits.length === 11) return { cpf: document }
  return {}
}

const mapPartnerToContractor = (
  partner: { id: string; name: string; document: string; email?: string; telephone?: string } | undefined,
) => {
  if (!partner) return undefined
  return {
    id: partner.id,
    name: partner.name,
    email: partner.email,
    telephone: partner.telephone,
    ...mapDocumentToCnpjCpf(partner.document),
  }
}

const mapStatusModelToDomain = (status: string): ContractStatus => {
  const map: Record<string, ContractStatus> = {
    Pendente: 'Pendente',
    'Em Andamento': 'Em Andamento',
    Finalizado: 'Finalizado',
    Distrato: 'Distrato',
  }
  return map[status] ?? 'Pendente'
}

const mapContractTypeModelToDomain = (type: string): ContractType => {
  const map: Record<string, ContractType> = {
    Supplier: 'Fornecedor',
    Financier: 'Financiador',
    Collaborator: 'Colaborador',
    ACT: 'ACT',
  }
  return map[type] ?? 'Fornecedor'
}

const mapAmendmentToChild = (amendment: AmendmentModel): ContractRow => {
  return {
    id: amendment.id,
    classification: 'Contrato',
    contractModel: 'Serviço',
    object: amendment.description ?? '',
    totalValue: (amendment.impactValueCents ?? 0) / 100,
    contractPeriod: {
      start: amendment.startDate ?? amendment.newEndDate ?? new Date(),
      end: amendment.newEndDate ?? amendment.startDate ?? new Date(),
    },
    contractType: 'Fornecedor',
    contractStatus: amendment.status === 'Homologado' ? 'Em Andamento' : 'Pendente',
    contractCode: amendment.amendmentNumber,
    files: [],
    children: [],
    createdAt: amendment.createdAt,
    signedContractUrl: amendment.signedContractUrl,
    // Runtime fields accessed via as-unknown casts in deriveStatus / calculateValorAtual
    aditivoType: amendment.type,
    aditivoStatus: amendment.status,
  } as unknown as ContractRow
}

export function mapModelToContractRow(model: ContractModel): ContractRow {
  return {
    id: model.id,
    classification: 'Contrato',
    contractModel: 'Serviço',
    object: model.objective,
    totalValue: model.originalValue.cents / 100,
    currentValue: model.currentValue.cents / 100,
    // Vigência vigente (estendida por aditivo de prazo homologado); cai no original se não houver.
    contractPeriod: model.currentPeriod ?? model.originalPeriod,
    contractType: mapContractTypeModelToDomain(model.contractType),
    supplierId: model.supplierId ?? undefined,
    financierId: model.financierId ?? undefined,
    collaboratorId: model.collaboratorId ?? undefined,
    budgetPlanId: model.budgetPlanId ? String(model.budgetPlanId) : undefined,
    programId: model.programId ? String(model.programId) : undefined,
    supplier: mapPartnerToContractor(model.supplier),
    financier: mapPartnerToContractor(model.financier),
    collaborator: mapPartnerToContractor(model.collaborator),
    program: model.program ? { id: String(model.program.id), name: model.program.name } : undefined,
    budgetPlan: model.budgetPlan
      ? {
          id: String(model.budgetPlan.id),
          scenarioName: model.budgetPlan.scenarioName,
          year: model.budgetPlan.year,
          version: model.budgetPlan.version,
        }
      : undefined,
    contractStatus: mapStatusModelToDomain(model.status),
    contractCode: model.sequentialNumber,
    files: model.files.map((f) => ({ id: f.id, fileUrl: f.url })),
    children: model.children.map(mapAmendmentToChild),
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    observations: model.observations,
    email: model.email,
    telephone: model.telephone,
    bancaryInfo: model.bancaryInfo
      ? {
          bank: model.bancaryInfo.bank,
          agency: model.bancaryInfo.agency,
          accountNumber: model.bancaryInfo.accountNumber,
          dv: model.bancaryInfo.dv,
        }
      : undefined,
    pixInfo: model.pixInfo ? { key_type: model.pixInfo.keyType, key: model.pixInfo.key } : undefined,
    origin: model.origin,
    categorizacao: model.categorizacao,
    centroDeCusto: model.centroDeCusto,
  } as unknown as ContractRow
}

export function mapListResponseToContractRows(response: ListContractsResponse): readonly ContractRow[] {
  return response.items.map(mapModelToContractRow)
}

export const contractListViewModel = {
  query: contractListQueryOptions,
}

export interface StatusChipCounts {
  readonly todos: number
  readonly 'em-andamento': number
  readonly pendente: number
  readonly finalizado: number
  readonly distrato: number
  readonly vencendo: number
  readonly [key: string]: number
}

export function computeStatusChipCounts(
  contracts: readonly ContractRow[],
): StatusChipCounts {
  const counts: Record<string, number> = {
    todos: contracts.length,
    'em-andamento': 0,
    pendente: 0,
    finalizado: 0,
    distrato: 0,
    vencendo: 0,
  }

  const now = Date.now()
  const msPerDay = 1000 * 60 * 60 * 24

  for (const contract of contracts) {
    const info = getMostRecentChild(contract)
    const derived = deriveStatus(info, !!(contract.children?.length ?? 0))
    counts[derived.key] = (counts[derived.key] ?? 0) + 1

    const daysUntilEnd = (info.contractPeriod.end.getTime() - now) / msPerDay
    if (daysUntilEnd >= 0 && daysUntilEnd <= 45) {
      counts.vencendo = (counts.vencendo ?? 0) + 1
    }
  }

  return counts as unknown as StatusChipCounts
}

// Parsing de parâmetro de data (YYYY-MM-DD da URL → Date). Fica na view-model: a page/filtros são
// views burras e não podem instanciar `new Date(` (C1) — o relógio/parse mora aqui.
export const parseDateParam = (s: string | undefined): Date | undefined =>
  s !== undefined && s !== '' ? new Date(s) : undefined

// Filtro "vencendo": recebe `nowMs` (estável, vindo do controller) — derivação pura, sem relógio no render.
export const filterExpiringRows = (
  rows: readonly ContractRow[],
  nowMs: number,
  thresholdDays = 45,
): readonly ContractRow[] => {
  const msPerDay = 1000 * 60 * 60 * 24
  return rows.filter((row) => {
    const daysUntilEnd = (row.contractPeriod.end.getTime() - nowMs) / msPerDay
    return daysUntilEnd >= 0 && daysUntilEnd <= thresholdDays
  })
}

// Normaliza uma data (string da URL ou ISO) para o formato YYYY-MM-DD do <input type="date">.
// Helper de view-model: a view de filtros é burra e não instancia `new Date(` (C1).
export const formatDateInput = (dateStr: string | undefined): string => {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  try {
    const d = new Date(dateStr)
    const yyyy = String(d.getFullYear())
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return ''
  }
}

// Carimbo de data (YYYY-MM-DD) para o nome do arquivo exportado. O relógio mora aqui, não na view (C1).
export const exportFileStamp = (): string => new Date().toISOString().slice(0, 10)

export { STATUS_OPTIONS, deriveStatus, getMostRecentChild, programaShort }
export {
  formatContractNumber,
  formatCurrency,
  formatDate,
} from '#modules/contracts/client/domain/format.ts'
export type { ContractRow } from '#modules/contracts/client/domain/types.ts'
export type { ContractListFilters } from '#modules/contracts/client/data/contract-list-filters.schema.ts'
