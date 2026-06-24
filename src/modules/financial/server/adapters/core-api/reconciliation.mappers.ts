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
  AccountStatementPeriod,
  BankStatementImport,
  BatchResult,
  CedenteAccount,
  CriterionKey,
  CriterionOutcome,
  CriterionResult,
  ManualEntryCreated,
  MatchSuggestion,
  Movement,
  PaidPayable,
  PeriodClosed,
  PeriodReopened,
  ReconciliationCreated,
  ReconciliationPeriod,
  ReconciliationStatus,
  ReconciliationType,
  ReconciliationUndone,
  RejectedSuggestion,
  StatementSuggestion,
  StatementTransaction,
  SuggestionBand,
  TransactionReconciliation,
  FinancialCategory,
  FinancialCostCenter,
} from '#modules/financial/server/domain/reconciliation.io.ts'
import {
  CoreApiAccountStatementSchema,
  CoreApiBatchSchema,
  CoreApiCategoriesSchema,
  CoreApiCostCentersSchema,
  CoreApiCedenteAccountSchema,
  CoreApiCedenteAccountsSchema,
  type CoreApiCedenteAccount,
  CoreApiImportSchema,
  CoreApiManualEntrySchema,
  CoreApiPaidPayablesSchema,
  CoreApiPeriodClosedSchema,
  CoreApiPeriodReopenedSchema,
  CoreApiReconciliationCreatedSchema,
  CoreApiReconciliationPeriodsSchema,
  CoreApiRejectSchema,
  CoreApiStatementSuggestionsSchema,
  CoreApiSuggestionsSchema,
  CoreApiTransactionReconciliationSchema,
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

// Batch (#174): preserva null (não-Pending / sem candidato); banda desconhecida (drift) → null (não
// fabrica palpite). Diferente de `mapBand`, que assume sempre haver banda.
const mapTopBand = (raw: string | null): SuggestionBand | null =>
  raw === 'alta' ? 'alta' : raw === 'media' ? 'media' : null

// Breakdown (#140): critérios é conjunto fechado — desconhecido é descartado (não há fallback seguro p/
// peso). result drift → 'falha' (conservador). `mapCriterion` devolve null p/ a borda filtrar.
const CRITERION_KEYS: readonly CriterionKey[] = [
  'exactValue',
  'payeeMatch',
  'dateD0',
  'memoRef',
  'supplierOpen',
]
const mapCriterion = (raw: string): CriterionKey | null =>
  CRITERION_KEYS.includes(raw as CriterionKey) ? (raw as CriterionKey) : null

const CRITERION_OUTCOMES: readonly CriterionOutcome[] = ['ok', 'parcial', 'falha']
const mapOutcome = (raw: string): CriterionOutcome =>
  CRITERION_OUTCOMES.includes(raw as CriterionOutcome) ? (raw as CriterionOutcome) : 'falha'

const TX_RECON_TYPES: readonly TransactionReconciliation['type'][] = [
  'Individual',
  'Multiple',
  'Partial',
  'ManualEntry',
]
const mapTxReconType = (raw: string): TransactionReconciliation['type'] =>
  TX_RECON_TYPES.includes(raw as TransactionReconciliation['type'])
    ? (raw as TransactionReconciliation['type'])
    : 'Individual'

// ── API → Model (parse de borda; drift → err('server')) ─────────────────────────
export const importToModel = (raw: unknown): Result<BankStatementImport, ReconciliationError> => {
  const parsed = CoreApiImportSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const d = parsed.data
  return ok({
    statementId: d.statementId,
    imported: d.imported,
    duplicatesDiscarded: d.duplicatesDiscarded,
    // period também vem como ISO datetime do core-api → date-only p/ exibição honesta no resumo.
    period: { start: d.period.start.slice(0, 10), end: d.period.end.slice(0, 10) },
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
    // O core-api envia `date` como ISO datetime (ex.: 2026-06-18T00:00:00.000Z); o modelo do front é
    // date-only (YYYY-MM-DD) — agrupamento por dia e formatação assumem isso. Normaliza aqui na borda.
    date: t.date.slice(0, 10),
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
    paidAt: p.paidAt ?? null, // ausente na rota hoje → null; acende quando o backend expor (core-api#265)
    paymentMethod: p.paymentMethod,
    supplierName: p.supplierName,
    documentNumber: p.documentNumber,
    category: null, // core-api#172: categoria do título ainda não vem no contrato
    documentType: null, // core-api#172: tipo de documento ainda não vem no contrato
  }))
  return ok(items)
}

// ── Conta-cedente (#138) ────────────────────────────────────────────────────────
const mapAccountType = (t: string | null): CedenteAccount['type'] =>
  t === 'poupanca'
    ? 'Poupanca'
    : t === 'investimento'
      ? 'Investimento'
      : t === 'cartao' // #206
        ? 'Cartao'
        : t === 'outro'
          ? 'Outro'
          : 'Corrente'
const mapAccountStatus = (s: string): CedenteAccount['status'] =>
  s.toLowerCase() === 'closed' ? 'Closed' : 'Active'

const toCedenteAccount = (a: CoreApiCedenteAccount): CedenteAccount => ({
  id: a.id,
  bankCode: a.bankCode,
  bankName: a.bankName ?? a.bankCode,
  branch: a.agency,
  accountNumber: a.accountNumber,
  accountDv: a.accountDigit,
  alias: a.nickname ?? a.bankName ?? a.bankCode,
  type: mapAccountType(a.type),
  typeLabel: a.typeLabel, // #206
  status: mapAccountStatus(a.status),
  // saldo corrente, lastUpdated e contagem de pendências dependem do read-model #139 → defaults honestos
  currentBalanceCents: a.openingBalanceCents ?? '0',
  lastUpdatedAt: a.openingBalanceDate ?? '',
  pendingCount: 0,
})

export const cedenteAccountsToModel = (
  raw: unknown,
): Result<readonly CedenteAccount[], ReconciliationError> => {
  const parsed = CoreApiCedenteAccountsSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok(parsed.data.map(toCedenteAccount))
}

export const cedenteAccountToModel = (raw: unknown): Result<CedenteAccount, ReconciliationError> => {
  const parsed = CoreApiCedenteAccountSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok(toCedenteAccount(parsed.data))
}

// Resumo do read-model do extrato (#139) usado p/ enriquecer a conta no grid/hero: saldo corrente,
// contagem de pendências e data da última movimentação. O fan-out por conta vive no cliente HTTP.
export type AccountStatementSummary = Readonly<{
  closingBalanceCents: string
  pendingCount: number
  lastDate: string | null
}>

export const accountStatementSummary = (
  raw: unknown,
): Result<AccountStatementSummary, ReconciliationError> => {
  const parsed = CoreApiAccountStatementSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const d = parsed.data
  const lastDay = d.days.at(-1)
  return ok({
    closingBalanceCents: d.closingBalanceCents,
    pendingCount: d.counters.pending,
    lastDate: lastDay ? lastDay.date.slice(0, 10) : null,
  })
}

// #205: saldo do PERÍODO (abertura acumulada até `from` + fechamento) e soma das entradas/saídas dos dias.
// Soma em BigInt p/ não perder precisão de centavos. Espelha o read-model do extrato por período.
export const accountStatementPeriodToModel = (
  raw: unknown,
): Result<AccountStatementPeriod, ReconciliationError> => {
  const parsed = CoreApiAccountStatementSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const d = parsed.data
  const sumBy = (pick: (x: { inCents: string; outCents: string }) => string): string =>
    String(d.days.reduce((acc, day) => acc + BigInt(pick(day) || '0'), 0n))
  // #205: linhas (dia → movimentos) achatadas em StatementTransaction p/ a aba Extrato reusar o grid.
  // `balanceAfterCents` = saldo CORRENTE por linha (runningBalanceCents); `date` date-only.
  const movements: readonly StatementTransaction[] = d.days.flatMap((day) =>
    day.lines.map((ln) => ({
      id: ln.id,
      fitid: '',
      date: ln.date.slice(0, 10),
      movement: mapMovement(ln.movement),
      entryType: ln.entryType,
      payeeName: ln.payeeName,
      memo: ln.memo,
      valueCents: ln.valueCents,
      balanceAfterCents: ln.runningBalanceCents,
      reconciliationStatus: mapReconStatus(ln.reconciliationStatus),
    })),
  )
  return ok({
    openingBalanceCents: d.openingBalanceCents,
    closingBalanceCents: d.closingBalanceCents,
    totalInCents: sumBy((x) => x.inCents),
    totalOutCents: sumBy((x) => x.outCents),
    counters: d.counters,
    movements,
  })
}

const toBreakdown = (
  raw: readonly { criterion: string; weight: number; result: string; detail: string }[],
): readonly CriterionResult[] =>
  raw.flatMap((c) => {
    const criterion = mapCriterion(c.criterion)
    if (criterion === null) return [] // critério desconhecido (drift) → descarta
    return [{ criterion, weight: c.weight, result: mapOutcome(c.result), detail: c.detail }]
  })

export const suggestionsToModel = (raw: unknown): Result<readonly MatchSuggestion[], ReconciliationError> => {
  const parsed = CoreApiSuggestionsSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const items: readonly MatchSuggestion[] = parsed.data.suggestions.map((s) => ({
    payableId: s.payableId,
    score: s.score,
    band: mapBand(s.band),
    criteria: { ...s.criteria },
    criteriaBreakdown: toBreakdown(s.criteriaBreakdown),
  }))
  return ok(items)
}

export const statementSuggestionsToModel = (
  raw: unknown,
): Result<readonly StatementSuggestion[], ReconciliationError> => {
  const parsed = CoreApiStatementSuggestionsSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const items: readonly StatementSuggestion[] = parsed.data.items.map((s) => ({
    transactionId: s.transactionId,
    topBand: mapTopBand(s.topBand),
    topScore: s.topScore,
  }))
  return ok(items)
}

export const transactionReconciliationToModel = (
  raw: unknown,
): Result<TransactionReconciliation, ReconciliationError> => {
  const parsed = CoreApiTransactionReconciliationSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const d = parsed.data
  return ok({
    reconciliationId: d.id,
    transactionId: d.transactionId,
    type: mapTxReconType(d.type),
    status: d.status === 'Undone' ? 'Undone' : 'Active',
    reconciledBy: d.reconciledBy,
    reconciledAt: d.reconciledAt,
    differenceCents: d.differenceCents,
    items: d.items.map((i) => ({ payableId: i.payableId, reconciledValueCents: i.reconciledValueCents })),
  })
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

// #203: reabrir período.
export const periodReopenedToModel = (raw: unknown): Result<PeriodReopened, ReconciliationError> => {
  const parsed = CoreApiPeriodReopenedSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok({ periodId: parsed.data.periodId, status: 'Open' })
}

export const reconciliationPeriodsToModel = (
  raw: unknown,
): Result<readonly ReconciliationPeriod[], ReconciliationError> => {
  const parsed = CoreApiReconciliationPeriodsSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  const items: readonly ReconciliationPeriod[] = parsed.data.map((p) => ({
    id: p.id,
    debitAccountRef: p.debitAccountRef,
    periodStart: p.periodStart.slice(0, 10),
    periodEnd: p.periodEnd.slice(0, 10),
    status: p.status === 'Closed' ? 'Closed' : 'Open',
    closedAt: p.closedAt,
    closedBy: p.closedBy,
  }))
  return ok(items)
}

export const rejectToModel = (raw: unknown): Result<RejectedSuggestion, ReconciliationError> => {
  const parsed = CoreApiRejectSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok({ transactionId: parsed.data.transactionId, payableId: parsed.data.payableId })
}

// Referências da categorização (020). Resposta = array nu. `group` tolerante → union (fallback 'despesa').
const mapCategoryGroup = (g: string): FinancialCategory['group'] =>
  g === 'receita' ? 'receita' : g === 'ajuste' ? 'ajuste' : 'despesa'

export const categoriesToModel = (
  raw: unknown,
): Result<readonly FinancialCategory[], ReconciliationError> => {
  const parsed = CoreApiCategoriesSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok(
    parsed.data.map((c) => ({
      id: c.id,
      name: c.name,
      group: mapCategoryGroup(c.group),
      parentId: c.parentId,
    })),
  )
}

export const costCentersToModel = (
  raw: unknown,
): Result<readonly FinancialCostCenter[], ReconciliationError> => {
  const parsed = CoreApiCostCentersSchema.safeParse(raw)
  if (!parsed.success) return err('server')
  return ok(parsed.data.map((c) => ({ id: c.id, code: c.code, name: c.name })))
}
