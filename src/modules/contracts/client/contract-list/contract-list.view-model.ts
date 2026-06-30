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
import { formatContractNumber, formatCurrency, formatDate } from '#modules/contracts/client/domain/format.ts'
import { normalizeCnpj, maskCnpj, maskCpf } from '#shared/document/cnpj.ts'
import type { ContractRow, ContractStatus, ContractType } from '#modules/contracts/client/domain/types.ts'
import type { ContractPayment } from '#modules/financial/public-api/index.ts'
import type {
  Contract as ContractModel,
  Amendment as AmendmentModel,
  ListContractsResponse,
} from '#modules/contracts/client/data/model/contracts.model.ts'

import { contractListQueryOptions } from './contract-list.query.ts'

const mapDocumentToCnpjCpf = (document: string | undefined): { cnpj?: string; cpf?: string } => {
  if (!document) return {}
  const len = normalizeCnpj(document).length // CNPJ=14 (alfanumérico Serpro/2026), CPF=11 numérico
  if (len === 14) return { cnpj: document }
  if (len === 11) return { cpf: document }
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
    Cancelado: 'Cancelado',
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
    // Classificação REAL do contrato (#32) → prefixo CT/OS correto na coluna Número do grid.
    // model.classification é 'Contract'|'ServiceOrder'; o domínio usa 'Contrato'|'Ordem de Serviço'.
    classification: model.classification === 'ServiceOrder' ? 'Ordem de Serviço' : 'Contrato',
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
    actId: model.actId ?? undefined,
    budgetPlanId: model.budgetPlanId ?? undefined,
    programId: model.programId ?? undefined,
    supplier: mapPartnerToContractor(model.supplier),
    financier: mapPartnerToContractor(model.financier),
    collaborator: mapPartnerToContractor(model.collaborator),
    act: mapPartnerToContractor(model.act),
    program: model.program
      ? { id: model.program.id, name: model.program.name, sigla: model.program.sigla }
      : undefined,
    budgetPlan: model.budgetPlan
      ? {
          id: model.budgetPlan.id,
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

/** Contratado da linha conforme o tipo (supplier/financier/collaborator/act). `switch` exaustivo. */
export function getContractorFromRow(row: ContractRow): ContractRow['supplier'] {
  switch (row.contractType) {
    case 'Fornecedor':
      return row.supplier
    case 'Financiador':
      return row.financier
    case 'Colaborador':
      return row.collaborator
    case 'ACT':
      return row.act
    default: {
      const _exhaustive: never = row.contractType
      return _exhaustive
    }
  }
}

// CSV legível da listagem (todas as colunas de negócio: contratado, doc, valores formatados, datas).
// PURO. Usado pelo export "todos os contratos" (pagina a lista e monta o arquivo completo).
const CSV_HEADERS: readonly string[] = [
  'Número',
  'Contratado',
  'CNPJ/CPF',
  'Objeto',
  'Tipo',
  'Programa',
  'Valor Atual',
  'Saldo',
  'Início',
  'Fim',
  'Status',
]
const csvCell = (v: string): string => `"${v.replace(/"/g, '""')}"`

export function buildContractsCsv(rows: readonly ContractRow[]): string {
  const lines = rows.map((row) => {
    const c = getContractorFromRow(row)
    const info = getMostRecentChild(row)
    const derived = deriveStatus(info, !!(row.children?.length ?? 0))
    const valorAtual = row.currentValue ?? row.totalValue
    return [
      formatContractNumber(row.contractCode),
      c?.name ?? '—',
      c?.cnpj ?? c?.cpf ?? '',
      row.object,
      row.contractType,
      row.program?.name ?? '',
      formatCurrency(valorAtual),
      '—',
      formatDate(row.contractPeriod.start),
      formatDate(row.contractPeriod.end),
      derived.label,
    ]
      .map(csvCell)
      .join(';')
  })
  return [CSV_HEADERS.join(';'), ...lines].join('\n')
}

// Máscara de documento (CPF 11 / CNPJ 14 alfanumérico Serpro/2026) p/ exibição em documentos.
const maskDocForDoc = (raw: string): string => {
  const len = normalizeCnpj(raw).length
  if (len === 11) return maskCpf(raw)
  if (len === 14) return maskCnpj(raw)
  return raw
}

// Uma linha do Histórico de Pagamento (já formatada p/ a view imprimível).
export interface ContractPaymentRow {
  readonly index: string // 1, 2, 3… na ordem cronológica do pagamento
  readonly type: string // forma de pagamento (PIX, Boleto…)
  readonly document: string // nº do documento
  readonly supplier: string // nome do fornecedor
  readonly date: string // data do pagamento (DD/MM/AAAA) ou "—"
  readonly gross: string // valor bruto do documento (BRL)
  readonly balance: string // saldo do contrato após este pagamento (cascata)
}

export interface ContractDocData {
  readonly number: string
  readonly contractor: string
  readonly document: string
  readonly object: string
  readonly type: string
  readonly value: string
  readonly period: string
  readonly status: string
  readonly openingBalance: string // saldo inicial do contrato (= valor atual) formatado
  readonly payments: readonly ContractPaymentRow[] // só no Histórico; vazio no Termo de Quitação
}

// Monta (puro) os dados padronizados de um contrato para os documentos imprimíveis (Termo de
// Quitação / Histórico de Pagamento). A view só renderiza — formatação/derivação moram aqui (C1).
export function buildContractDocData(row: ContractRow): ContractDocData {
  const c = row.supplier ?? row.financier ?? row.collaborator ?? row.act
  const contractor = c?.name ?? c?.corporateName ?? c?.fantasyName ?? '—'
  const rawDoc = c?.cnpj ?? c?.cpf ?? ''
  // Status REAL do contrato (mesma derivação do grid: a partir do `row`, não do aditivo mais recente).
  const derived = deriveStatus(row, !!(row.children?.length ?? 0))
  const valor = row.currentValue ?? row.totalValue
  return {
    number: formatContractNumber(row.contractCode, row.classification),
    contractor,
    document: rawDoc !== '' ? maskDocForDoc(rawDoc) : '—',
    object: row.object !== '' ? row.object : '—',
    type: row.contractType,
    value: formatCurrency(valor),
    period: `${formatDate(row.contractPeriod.start)} — ${formatDate(row.contractPeriod.end)}`,
    status: derived.label,
    openingBalance: formatCurrency(valor),
    payments: [],
  }
}

// Data-only ISO (YYYY-MM-DD) → DD/MM/AAAA sem passar por `new Date` (evita deslocamento de fuso).
const formatPaidDate = (iso: string): string => {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y !== undefined && m !== undefined && d !== undefined ? `${d}/${m}/${y}` : iso
}

// Ordena por data de pagamento ASC (mais antigo no topo); sem data vai para o fim.
const byPaidAtAsc = (a: ContractPayment, b: ContractPayment): number => {
  if (a.paidAt === null && b.paidAt === null) return 0
  if (a.paidAt === null) return 1
  if (b.paidAt === null) return -1
  return a.paidAt < b.paidAt ? -1 : a.paidAt > b.paidAt ? 1 : 0
}

// Linhas do histórico (puro/testável): pagamentos em ordem cronológica (mais antigo no topo), numerados
// 1,2,3…, com o saldo do contrato deduzido em CASCATA a partir do saldo inicial (em reais). Sem `ContractRow`.
export function buildHistoricoRows(
  openingValueReais: number,
  supplierName: string,
  payments: readonly ContractPayment[],
): readonly ContractPaymentRow[] {
  let runningCents = Math.round(openingValueReais * 100)
  return [...payments].sort(byPaidAtAsc).map((p, i) => {
    const grossCents = p.grossValueCents !== null ? Number.parseInt(p.grossValueCents, 10) || 0 : 0
    runningCents -= grossCents
    return {
      index: String(i + 1),
      type: p.documentType,
      document: p.documentNumber ?? '—',
      supplier: supplierName,
      date: p.paidAt !== null ? formatPaidDate(p.paidAt) : '—',
      gross: formatCurrency(grossCents / 100),
      balance: formatCurrency(runningCents / 100),
    }
  })
}

// Histórico de Pagamento (puro): pagamentos CONCILIADOS do contrato com o saldo em cascata.
export function buildContractHistoricoData(
  row: ContractRow,
  payments: readonly ContractPayment[],
): ContractDocData {
  const base = buildContractDocData(row)
  const valor = row.currentValue ?? row.totalValue
  return { ...base, payments: buildHistoricoRows(valor, base.contractor, payments) }
}

// Saldo do contrato no grid = valor (atual, reais) − Σ do valor BRUTO conciliado (centavos) do contrato.
// Sem pagamentos → o saldo é o próprio valor. `grossByContractCents`: contractRef → total bruto (centavos).
export function contractSaldoText(
  row: ContractRow,
  grossByContractCents: Readonly<Record<string, number>>,
): string {
  const valor = row.currentValue ?? row.totalValue
  const paidCents = grossByContractCents[String(row.id)] ?? 0
  return formatCurrency(valor - paidCents / 100)
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
  readonly cancelado: number
  readonly vencendo: number
  readonly [key: string]: number
}

export function computeStatusChipCounts(contracts: readonly ContractRow[]): StatusChipCounts {
  const counts: Record<string, number> = {
    todos: contracts.length,
    'em-andamento': 0,
    pendente: 0,
    finalizado: 0,
    distrato: 0,
    cancelado: 0,
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

// Data de emissão (dd/mm/aaaa) p/ os documentos imprimíveis. Recebe `nowMs` (estável, do controller)
// — a view não instancia relógio (C1/§XI); a formatação mora aqui.
export const formatEmittedDate = (nowMs: number): string =>
  new Date(nowMs).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

export { STATUS_OPTIONS, deriveStatus, getMostRecentChild, programaShort }
export {
  formatContractNumber,
  formatCurrency,
  formatDate,
  contractorInitials,
} from '#modules/contracts/client/domain/format.ts'
export type { ContractRow } from '#modules/contracts/client/domain/types.ts'
export type { ContractListFilters } from '#modules/contracts/client/data/contract-list-filters.schema.ts'
