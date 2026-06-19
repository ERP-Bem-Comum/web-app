/**
 * Mappers PUROS do core-api `/api/v2/financial` (conciliação) ↔ Model do front. Sem I/O (testável em
 * node:test). O cliente HTTP (`core-api-reconciliation.ts`) faz o fetch e delega a tradução aqui.
 * Anti-corruption (§III): enums tolerantes (drift → fallback), envelope de erro → `ReconciliationError`
 * (§V). `entryType` é repassado cru (string livre). Espelha `financial.mappers.ts`.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { HttpError } from '#shared/http/http-error.types.ts'
import { parseErrorEnvelope } from '#shared/http/error-envelope.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'
import type {
  BankStatementImport,
  BatchResult,
  ManualEntryCreated,
  MatchSuggestion,
  Movement,
  PaidPayable,
  PeriodClosed,
  ReconciliationCreated,
  ReconciliationStatus,
  ReconciliationType,
  ReconciliationUndone,
  RejectedSuggestion,
  StatementTransaction,
  SuggestionBand,
} from '#modules/financial/server/domain/reconciliation.io.ts'
import {
  CoreApiBatchSchema,
  CoreApiImportSchema,
  CoreApiManualEntrySchema,
  CoreApiPaidPayablesSchema,
  CoreApiPeriodClosedSchema,
  CoreApiReconciliationCreatedSchema,
  CoreApiRejectSchema,
  CoreApiSuggestionsSchema,
  CoreApiTransactionsSchema,
  CoreApiUndoSchema,
} from './reconciliation.schema.ts'

// ── Erro: slug do core-api → ReconciliationError ────────────────────────────────
const SLUG_TO_ERROR: Partial<Record<string, ReconciliationError>> = {
  'unsupported-format': 'import-unsupported-format',
  'empty-content': 'import-empty-content',
  'malformed-statement': 'import-malformed',
  'empty-statement': 'import-empty-statement',
  'period-closed': 'period-closed',
  'period-has-pending-transactions': 'period-has-pending',
  'invalid-period-range': 'invalid-period-range',
  'reconciliation-period-not-found': 'period-not-found',
  'reconciliation-not-balanced': 'reconciliation-not-balanced',
  'transaction-already-reconciled': 'transaction-already-reconciled',
  'account-closed': 'account-closed',
  'payable-not-found': 'payable-not-found',
  'title-not-paid': 'title-not-paid',
  'empty-reconciliation': 'empty-reconciliation',
  'reconciliation-already-undone': 'reconciliation-already-undone',
  'unsupported-export-format': 'export-unsupported-format',
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
}

const statusToError = (status: number, slug: string | undefined): ReconciliationError => {
  const bySlug = slug === undefined ? undefined : SLUG_TO_ERROR[slug]
  if (bySlug !== undefined) return bySlug
  if (status === 404) return 'not-found'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 409) return 'conflict'
  if (status === 400 || status === 422) return 'validation'
  return 'server'
}

export const mapHttpError = (e: HttpError): ReconciliationError => {
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
      const _exhaustive: never = e
      return _exhaustive
    }
  }
}

// ── Enums tolerantes (drift → fallback) ─────────────────────────────────────────
const mapMovement = (raw: string): Movement => (raw === 'Credit' ? 'Credit' : 'Debit')

const RECON_STATUSES: readonly ReconciliationStatus[] = ['Pending', 'Reconciled', 'ManualEntry']
const mapReconStatus = (raw: string): ReconciliationStatus =>
  RECON_STATUSES.includes(raw as ReconciliationStatus) ? (raw as ReconciliationStatus) : 'Pending'

const RECON_TYPES: readonly ReconciliationType[] = ['Individual', 'Multiple', 'Partial']
const mapReconType = (raw: string): ReconciliationType =>
  RECON_TYPES.includes(raw as ReconciliationType) ? (raw as ReconciliationType) : 'Individual'

const mapBand = (raw: string): SuggestionBand => (raw === 'alta' ? 'alta' : 'media')

// ── API → Model (parse de borda; drift → err('server')) ─────────────────────────
export const importToModel = (raw: unknown): Result<BankStatementImport, ReconciliationError> => {
  const parsed = CoreApiImportSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const d = parsed.data
  return ok({
    statementId: d.statementId,
    imported: d.imported,
    duplicatesDiscarded: d.duplicatesDiscarded,
    period: { start: d.period.start, end: d.period.end },
  })
}

export const transactionsToModel = (
  raw: unknown,
): Result<readonly StatementTransaction[], ReconciliationError> => {
  const parsed = CoreApiTransactionsSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const items: readonly StatementTransaction[] = parsed.data.items.map((t) => ({
    id: t.id,
    fitid: t.fitid,
    date: t.date,
    movement: mapMovement(t.movement),
    entryType: t.entryType,
    payeeName: t.payeeName,
    memo: t.memo,
    valueCents: t.valueCents,
    balanceAfterCents: t.balanceAfterCents,
    reconciliationStatus: mapReconStatus(t.reconciliationStatus),
  }))
  return ok(items)
}

export const paidPayablesToModel = (raw: unknown): Result<readonly PaidPayable[], ReconciliationError> => {
  const parsed = CoreApiPaidPayablesSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const items: readonly PaidPayable[] = parsed.data.items.map((p) => ({
    id: p.id,
    documentId: p.documentId,
    valueCents: p.valueCents,
    dueDate: p.dueDate,
    paymentMethod: p.paymentMethod,
    supplierName: p.supplierName,
    documentNumber: p.documentNumber,
  }))
  return ok(items)
}

export const suggestionsToModel = (raw: unknown): Result<readonly MatchSuggestion[], ReconciliationError> => {
  const parsed = CoreApiSuggestionsSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const items: readonly MatchSuggestion[] = parsed.data.suggestions.map((s) => ({
    payableId: s.payableId,
    score: s.score,
    band: mapBand(s.band),
    criteria: { ...s.criteria },
  }))
  return ok(items)
}

export const reconciliationCreatedToModel = (
  raw: unknown,
): Result<ReconciliationCreated, ReconciliationError> => {
  const parsed = CoreApiReconciliationCreatedSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const d = parsed.data
  return ok({ reconciliationId: d.reconciliationId, type: mapReconType(d.type), itemCount: d.itemCount })
}

export const undoToModel = (raw: unknown): Result<ReconciliationUndone, ReconciliationError> => {
  const parsed = CoreApiUndoSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok({ reconciliationId: parsed.data.reconciliationId, status: 'Undone' })
}

export const manualEntryToModel = (raw: unknown): Result<ManualEntryCreated, ReconciliationError> => {
  const parsed = CoreApiManualEntrySchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok({
    reconciliationId: parsed.data.reconciliationId,
    type: 'ManualEntry',
    manualEntryId: parsed.data.manualEntryId,
  })
}

export const batchToModel = (raw: unknown): Result<BatchResult, ReconciliationError> => {
  const parsed = CoreApiBatchSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const d = parsed.data
  return ok({
    created: d.created,
    reconciliationIds: d.reconciliationIds,
    failed: d.failed.map((f) => ({ transactionId: f.transactionId, error: f.error })),
  })
}

export const periodClosedToModel = (raw: unknown): Result<PeriodClosed, ReconciliationError> => {
  const parsed = CoreApiPeriodClosedSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok({ periodId: parsed.data.periodId, status: 'Closed' })
}

export const rejectToModel = (raw: unknown): Result<RejectedSuggestion, ReconciliationError> => {
  const parsed = CoreApiRejectSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok({ transactionId: parsed.data.transactionId, payableId: parsed.data.payableId })
}
