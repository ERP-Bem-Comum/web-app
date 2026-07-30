/**
 * Mappers PUROS do core-api `/api/v2/financial` ↔ Model do front. Sem I/O (testável em node:test). O
 * cliente HTTP (`core-api-financial.ts`) faz o fetch e delega a tradução aqui. Anti-corruption layer
 * (§III): status EN→PT, enums tolerantes (drift → fallback), envelope de erro → `FinancialError` (§V).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'
import type {
  DocumentDetail,
  DocumentStatus,
  DocumentSummary,
  DocumentType,
  PaymentMethod,
  Payable,
  PayableKind,
  RetentionType,
  DocumentListResponse,
  PayableTitleListResponse,
  PayableTitleItem,
  PayableCounts,
  RecentPayment,
  DocumentTimelineEvent,
  TimelineEventType,
} from '#modules/financial/server/domain/document.io.ts'
import {
  CoreApiDocumentSchema,
  CoreApiDocumentListSchema,
  CoreApiPayableTitleListSchema,
  CoreApiPayableCountsSchema,
  CoreApiRecentPaymentListSchema,
  CoreApiTimelineResponseSchema,
  type CoreApiPayable,
} from './financial.schema.ts'
import {
  DashboardCostCentersResponseSchema,
  DashboardNoContractSuppliersResponseSchema,
} from './dashboard.schema.ts'
import type {
  DashboardCostCenters,
  DashboardNoContractSupplier,
} from '#modules/financial/server/domain/dashboard.io.ts'

const TIMELINE_EVENT_TYPES: ReadonlySet<string> = new Set<TimelineEventType>([
  'DocumentDraftSaved',
  'DocumentSaved',
  'PayableApproved',
  'ApprovalUndone',
  'PayableManuallyPaid',
  'PayableReconciled',
  'ReconciliationUndone',
])

// ── Erro: slug do core-api → FinancialError ─────────────────────────────────────
const SLUG_TO_ERROR: Partial<Record<string, FinancialError>> = {
  'document-not-found': 'not-found',
  'invalid-state-transition': 'invalid-transition',
  'net-value-not-positive': 'net-value-invalid',
  'retention-not-allowed-for-type': 'retention-not-allowed',
  'document-incomplete': 'document-incomplete',
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
}

const statusToError = (status: number, slug: string | undefined): FinancialError => {
  const bySlug = slug === undefined ? undefined : SLUG_TO_ERROR[slug]
  if (bySlug !== undefined) return bySlug
  if (status === 404) return 'not-found'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 409) return 'conflict'
  if (status === 400 || status === 422) return 'validation'
  return 'server'
}

export const mapHttpError = (e: HttpError): FinancialError => {
  switch (e.kind) {
    case 'http':
      return statusToError(e.status, parseErrorEnvelope(e.body)?.error.code)
    case 'network':
    case 'timeout':
      return 'connectivity'
    case 'parse':
    case 'aborted':
      return 'server'
    default: {
      const exhaustive: never = e
      return exhaustive
    }
  }
}

// ── Enums tolerantes (drift → fallback) ─────────────────────────────────────────
const STATUS_MAP: Record<string, DocumentStatus> = {
  Draft: 'Rascunho',
  Open: 'Aberto',
  Approved: 'Aprovado',
  Transmitted: 'Transmitido',
  Refused: 'Recusado',
  Paid: 'Pago',
  Reconciled: 'Conciliado',
}
export const mapStatus = (raw: string): DocumentStatus => STATUS_MAP[raw] ?? 'Aberto'

const DOCUMENT_TYPES: readonly DocumentType[] = [
  'NFS-e',
  'DANFE',
  'RPA',
  'Fatura',
  'Boleto',
  'Recibo',
  'Imposto',
]
const PAYMENT_METHODS: readonly PaymentMethod[] = [
  'TED',
  'TransferenciaBancaria',
  'PIX',
  'Boleto',
  'CartaoCorporativo',
  'Cambio',
  'GuiaRecolhimento',
  'Outro',
]
const RETENTION_TYPES: readonly RetentionType[] = ['ISS', 'IRRF', 'INSS', 'CSRF']
const PAYABLE_KINDS: readonly PayableKind[] = ['Parent', 'Child']

const mapType = (raw: string | null): DocumentType | null =>
  raw !== null && DOCUMENT_TYPES.includes(raw as DocumentType) ? (raw as DocumentType) : null
const mapPaymentMethod = (raw: string | null): PaymentMethod | null =>
  raw !== null && PAYMENT_METHODS.includes(raw as PaymentMethod) ? (raw as PaymentMethod) : null
const mapRetentionType = (raw: string | null): RetentionType | null =>
  raw !== null && RETENTION_TYPES.includes(raw as RetentionType) ? (raw as RetentionType) : null
const mapPayableKind = (raw: string): PayableKind =>
  PAYABLE_KINDS.includes(raw as PayableKind) ? (raw as PayableKind) : 'Child'

const payableToModel = (p: CoreApiPayable): Payable => ({
  id: p.id,
  kind: mapPayableKind(p.kind),
  retentionType: mapRetentionType(p.retentionType),
  valueCents: p.valueCents,
  status: mapStatus(p.status),
})

// ── API → Model (com parse de borda; drift → err('server')) ─────────────────────
export const detailToModel = (raw: unknown): Result<DocumentDetail, FinancialError> => {
  const parsed = CoreApiDocumentSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const d = parsed.data
  return ok({
    id: d.id,
    status: mapStatus(d.status),
    type: mapType(d.type),
    documentNumber: d.documentNumber,
    supplierRef: d.supplierRef,
    paymentMethod: mapPaymentMethod(d.paymentMethod),
    paymentDetail: d.paymentDetail ?? null, // #273 — complemento da forma de pagamento
    competencia: d.competencia ?? null, // #197 — competência (YYYY-MM)
    grossValueCents: d.grossValueCents,
    netValueCents: d.netValueCents,
    issueDate: d.issueDate, // #163 — date-only (YYYY-MM-DD), igual ao dueDate
    dueDate: d.dueDate,
    description: d.description,
    // #95/#147 — refs de categorização (resolvidas p/ nome no client; drift → null).
    budgetPlanRef: d.budgetPlanRef,
    categoryRef: d.categoryRef,
    subcategoryRef: d.subcategoryRef, // #502 (S1): folha da árvore do plano (drift → null)
    costCenterRef: d.costCenterRef,
    programRef: d.programRef,
    payables: d.payables.map(payableToModel),
    version: d.version,
    // #568: comprovante-fonte (OCR); null = documento sem anexo. Passthrough do objeto validado.
    attachment: d.attachment,
  })
}

export const listToModel = (raw: unknown): Result<DocumentListResponse, FinancialError> => {
  const parsed = CoreApiDocumentListSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const l = parsed.data
  const items: readonly DocumentSummary[] = l.items.map((s) => ({
    id: s.id,
    status: mapStatus(s.status),
    documentNumber: s.documentNumber,
    type: mapType(s.type),
    supplierRef: s.supplierRef,
    netValueCents: s.netValueCents,
    dueDate: s.dueDate,
    issueDate: s.issueDate, // #163 — data de emissão no grid
    series: s.series,
    grossValueCents: s.grossValueCents,
    paymentMethod: mapPaymentMethod(s.paymentMethod),
    contractRef: s.contractRef,
    version: s.version,
  }))
  return ok({ items, page: l.page, pageSize: l.pageSize, total: l.total })
}

// 042: widget "Últimos pagamentos" (Top-5 pagos). Array parse tolerante; drift → err('server').
export const recentPaymentsToModel = (raw: unknown): Result<readonly RecentPayment[], FinancialError> => {
  const parsed = CoreApiRecentPaymentListSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const items: readonly RecentPayment[] = parsed.data.map((p) => ({
    payableId: p.payableId,
    documentId: p.documentId,
    supplierRef: p.supplierRef,
    debitAccountRef: p.debitAccountRef,
    valueCents: p.valueCents,
    paidAt: p.paidAt,
  }))
  return ok(items)
}

// #241/#237: KPI "Despesas por Centro de Custo" (cost-centers). Parse tolerante; drift → err('server').
// O output do schema é estruturalmente o `DashboardCostCenters` do domínio (a fonte real formata/compõe).
export const dashboardCostCentersToModel = (raw: unknown): Result<DashboardCostCenters, FinancialError> => {
  const parsed = DashboardCostCentersResponseSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok(parsed.data)
}

// #242: widget "Fornecedores sem Contrato" (top-5). Desembrulha `.suppliers`; drift → err('server').
export const dashboardNoContractSuppliersToModel = (
  raw: unknown,
): Result<readonly DashboardNoContractSupplier[], FinancialError> => {
  const parsed = DashboardNoContractSuppliersResponseSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok(parsed.data.suppliers)
}

// Timeline → eventos CRUS (actor = UUID). Descarta entradas com eventType desconhecido (drift seguro). O
// enriquecimento do nome do autor acontece na server-fn (BFF).
export const timelineToModel = (raw: unknown): Result<readonly DocumentTimelineEvent[], FinancialError> => {
  const parsed = CoreApiTimelineResponseSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const events: DocumentTimelineEvent[] = []
  for (const e of parsed.data.entries) {
    if (!TIMELINE_EVENT_TYPES.has(e.eventType)) continue
    events.push({
      eventType: e.eventType as TimelineEventType,
      targetKind: e.target.kind === 'Payable' ? 'Payable' : 'Document',
      targetId: e.target.id,
      occurredAt: e.occurredAt,
      actor: e.actor,
      changes: e.changes.map((c) => ({ field: c.field, before: c.before, after: c.after })),
    })
  }
  return ok(events)
}

// #201: listagem por TÍTULO (pai + filhos). Reusa os mesmos enums tolerantes (status EN→PT, kind, etc).
export const payableTitlesToModel = (raw: unknown): Result<PayableTitleListResponse, FinancialError> => {
  const parsed = CoreApiPayableTitleListSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const l = parsed.data
  const items: readonly PayableTitleItem[] = l.items.map((p) => ({
    payableId: p.payableId,
    documentId: p.documentId,
    documentNumber: p.documentNumber,
    series: p.series,
    type: mapType(p.documentType),
    kind: mapPayableKind(p.kind),
    retentionType: mapRetentionType(p.retentionType),
    valueCents: p.valueCents,
    dueDate: p.dueDate,
    status: mapStatus(p.status),
    supplierRef: p.supplierRef,
    contractRef: p.contractRef,
    paidAt: p.paidAt ?? null, // core-api#231: data da baixa (null até pago)
    // #229: derivados do documento pai (paridade com o grid por documento).
    issueDate: p.issueDate ?? null,
    paymentMethod: mapPaymentMethod(p.paymentMethod ?? null),
    version: p.version ?? 0,
    grossValueCents: p.grossValueCents ?? null,
    netValueCents: p.netValueCents ?? null,
  }))
  return ok({ items, page: l.page, pageSize: l.pageSize, total: l.total })
}

// #536: contagem agregada — passthrough validado (byStatus é o breakdown cru dos títulos por status).
export const payableCountsToModel = (raw: unknown): Result<PayableCounts, FinancialError> => {
  const parsed = CoreApiPayableCountsSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok({ total: parsed.data.total, draft: parsed.data.draft, byStatus: parsed.data.byStatus })
}
