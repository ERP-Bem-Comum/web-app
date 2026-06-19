/**
 * ReconciliationRepository — porta do client para o BFF da Conciliação Bancária. Converte
 * `{ ok, data|error }` → `Result` (§II). Tipos do próprio `data/model`; `ReconciliationError`/
 * `ReconFnResult` do `reconciliation-error.ts` neutro (boundary §I). Fns injetadas (testável).
 *
 * `listAccounts`/`getAccount` ligados ao `/cedente-accounts` (#138). `exportPeriod` ainda é costura
 * honesta (#173, sem endpoint p/ obter o periodId). Espelha `financial.repository.ts`.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  BankStatementImport,
  BatchReconcileInput,
  BatchResult,
  ClosePeriodInput,
  CreateReconciliationInput,
  GetSuggestionsInput,
  ImportStatementInput,
  ListTransactionsInput,
  ManualEntryCreated,
  ManualEntryInput,
  MatchSuggestion,
  PaidPayable,
  PeriodClosed,
  ReconciliationAccount,
  ReconciliationCreated,
  ReconciliationUndone,
  RejectSuggestionInput,
  RejectedSuggestion,
  StatementTransaction,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
import type {
  ReconFnResult,
  ReconciliationError,
} from '#modules/financial/client/data/repository/reconciliation-error.ts'

type ImportFn = (opts: { data: ImportStatementInput }) => Promise<ReconFnResult<BankStatementImport>>
type ListTxFn = (opts: {
  data: ListTransactionsInput
}) => Promise<ReconFnResult<readonly StatementTransaction[]>>
type ListPayablesFn = () => Promise<ReconFnResult<readonly PaidPayable[]>>
type SuggestionsFn = (opts: {
  data: GetSuggestionsInput
}) => Promise<ReconFnResult<readonly MatchSuggestion[]>>
type RejectFn = (opts: { data: RejectSuggestionInput }) => Promise<ReconFnResult<RejectedSuggestion>>
type ReconcileFn = (opts: {
  data: CreateReconciliationInput
}) => Promise<ReconFnResult<ReconciliationCreated>>
type UndoFn = (opts: {
  data: { reconciliationId: string; reason?: string }
}) => Promise<ReconFnResult<ReconciliationUndone>>
type ManualFn = (opts: { data: ManualEntryInput }) => Promise<ReconFnResult<ManualEntryCreated>>
type BatchFn = (opts: { data: BatchReconcileInput }) => Promise<ReconFnResult<BatchResult>>
type CloseFn = (opts: { data: ClosePeriodInput }) => Promise<ReconFnResult<PeriodClosed>>
type ListAccountsFn = () => Promise<ReconFnResult<readonly ReconciliationAccount[]>>
type GetAccountFn = (opts: { data: { id: string } }) => Promise<ReconFnResult<ReconciliationAccount>>

export type ReconciliationRepository = Readonly<{
  importStatement: (i: ImportStatementInput) => Promise<Result<BankStatementImport, ReconciliationError>>
  listTransactions: (
    i: ListTransactionsInput,
  ) => Promise<Result<readonly StatementTransaction[], ReconciliationError>>
  listPaidPayables: () => Promise<Result<readonly PaidPayable[], ReconciliationError>>
  getSuggestions: (i: GetSuggestionsInput) => Promise<Result<readonly MatchSuggestion[], ReconciliationError>>
  rejectSuggestion: (i: RejectSuggestionInput) => Promise<Result<RejectedSuggestion, ReconciliationError>>
  createReconciliation: (
    i: CreateReconciliationInput,
  ) => Promise<Result<ReconciliationCreated, ReconciliationError>>
  undoReconciliation: (
    i: UndoReconciliationInput,
  ) => Promise<Result<ReconciliationUndone, ReconciliationError>>
  createManualEntry: (i: ManualEntryInput) => Promise<Result<ManualEntryCreated, ReconciliationError>>
  batchReconcile: (i: BatchReconcileInput) => Promise<Result<BatchResult, ReconciliationError>>
  closePeriod: (i: ClosePeriodInput) => Promise<Result<PeriodClosed, ReconciliationError>>
  // ── Costura honesta (#168/#173) — sem endpoint hoje ──
  listAccounts: () => Promise<Result<readonly ReconciliationAccount[], ReconciliationError>>
  getAccount: (id: string) => Promise<Result<ReconciliationAccount, ReconciliationError>>
}>

type UndoReconciliationInput = Readonly<{ reconciliationId: string; reason?: string }>

export const createReconciliationRepository = (
  deps: Readonly<{
    importStatementFn: ImportFn
    listTransactionsFn: ListTxFn
    listPaidPayablesFn: ListPayablesFn
    getSuggestionsFn: SuggestionsFn
    rejectSuggestionFn: RejectFn
    createReconciliationFn: ReconcileFn
    undoReconciliationFn: UndoFn
    createManualEntryFn: ManualFn
    batchReconcileFn: BatchFn
    closePeriodFn: CloseFn
    listAccountsFn: ListAccountsFn
    getAccountFn: GetAccountFn
  }>,
): ReconciliationRepository => ({
  importStatement: async (i) => {
    const res = await deps.importStatementFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  listTransactions: async (i) => {
    const res = await deps.listTransactionsFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  listPaidPayables: async () => {
    const res = await deps.listPaidPayablesFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
  getSuggestions: async (i) => {
    const res = await deps.getSuggestionsFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  rejectSuggestion: async (i) => {
    const res = await deps.rejectSuggestionFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  createReconciliation: async (i) => {
    const res = await deps.createReconciliationFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  undoReconciliation: async (i) => {
    const res = await deps.undoReconciliationFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  createManualEntry: async (i) => {
    const res = await deps.createManualEntryFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  batchReconcile: async (i) => {
    const res = await deps.batchReconcileFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  closePeriod: async (i) => {
    const res = await deps.closePeriodFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  // Conta-cedente (#138) — ligada ao GET /cedente-accounts (saldo/pendências completos com o #139).
  listAccounts: async () => {
    const res = await deps.listAccountsFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
  getAccount: async (id) => {
    const res = await deps.getAccountFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
