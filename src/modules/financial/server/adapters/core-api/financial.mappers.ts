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
} from '#modules/financial/server/domain/document.io.ts'
import { CoreApiDocumentSchema, CoreApiDocumentListSchema, type CoreApiPayable } from './financial.schema.ts'

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
    grossValueCents: d.grossValueCents,
    netValueCents: d.netValueCents,
    dueDate: d.dueDate,
    description: d.description,
    payables: d.payables.map(payableToModel),
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
  }))
  return ok({ items, page: l.page, pageSize: l.pageSize, total: l.total })
}
