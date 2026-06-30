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
  ReopenPeriodInput,
  CreateCedenteAccountInput,
  CreateReconciliationInput,
  AccountStatementPeriod,
  ExportReconciliationInput,
  FinancialReferences,
  GetAccountStatementInput,
  GetStatementSuggestionsInput,
  GetSuggestionsInput,
  ImportStatementInput,
  ListTransactionsInput,
  ManualEntryCreated,
  ManualEntryInput,
  MatchSuggestion,
  PaidPayable,
  PeriodClosed,
  PeriodReopened,
  ReconciliationAccount,
  ReconciliationCreated,
  ReconciliationExport,
  ReconciliationPeriod,
  ReconciliationUndone,
  RejectSuggestionInput,
  RejectedSuggestion,
  StatementSuggestion,
  StatementTransaction,
  TransactionReconciliation,
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
type ListReferencesFn = () => Promise<ReconFnResult<FinancialReferences>>
type GetStatementPeriodFn = (opts: {
  data: GetAccountStatementInput
}) => Promise<ReconFnResult<AccountStatementPeriod>>
type SuggestionsFn = (opts: {
  data: GetSuggestionsInput
}) => Promise<ReconFnResult<readonly MatchSuggestion[]>>
type StatementSuggestionsFn = (opts: {
  data: GetStatementSuggestionsInput
}) => Promise<ReconFnResult<readonly StatementSuggestion[]>>
type GetTxReconFn = (opts: {
  data: { transactionId: string }
}) => Promise<ReconFnResult<TransactionReconciliation | null>>
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
type ReopenFn = (opts: { data: ReopenPeriodInput }) => Promise<ReconFnResult<PeriodReopened>>
type ListPeriodsFn = (opts: {
  data: { debitAccountRef: string }
}) => Promise<ReconFnResult<readonly ReconciliationPeriod[]>>
type ExportFn = (opts: { data: ExportReconciliationInput }) => Promise<ReconFnResult<ReconciliationExport>>
type ListAccountsFn = () => Promise<ReconFnResult<readonly ReconciliationAccount[]>>
type GetAccountFn = (opts: { data: { id: string } }) => Promise<ReconFnResult<ReconciliationAccount>>
type CreateAccountFn = (opts: {
  data: CreateCedenteAccountInput
}) => Promise<ReconFnResult<ReconciliationAccount>>

export type ReconciliationRepository = Readonly<{
  importStatement: (i: ImportStatementInput) => Promise<Result<BankStatementImport, ReconciliationError>>
  listTransactions: (
    i: ListTransactionsInput,
  ) => Promise<Result<readonly StatementTransaction[], ReconciliationError>>
  listPaidPayables: () => Promise<Result<readonly PaidPayable[], ReconciliationError>>
  // Referências da categorização (020 · #200/#147) — categorias + centros de custo.
  getReferences: () => Promise<Result<FinancialReferences, ReconciliationError>>
  // Saldo do PERÍODO do extrato (#205).
  getAccountStatementPeriod: (
    i: GetAccountStatementInput,
  ) => Promise<Result<AccountStatementPeriod, ReconciliationError>>
  getSuggestions: (i: GetSuggestionsInput) => Promise<Result<readonly MatchSuggestion[], ReconciliationError>>
  getStatementSuggestions: (
    i: GetStatementSuggestionsInput,
  ) => Promise<Result<readonly StatementSuggestion[], ReconciliationError>>
  getTransactionReconciliation: (
    transactionId: string,
  ) => Promise<Result<TransactionReconciliation | null, ReconciliationError>>
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
  reopenPeriod: (i: ReopenPeriodInput) => Promise<Result<PeriodReopened, ReconciliationError>> // #203
  // Períodos + export reais (#173).
  listReconciliationPeriods: (
    debitAccountRef: string,
  ) => Promise<Result<readonly ReconciliationPeriod[], ReconciliationError>>
  exportReconciliation: (
    i: ExportReconciliationInput,
  ) => Promise<Result<ReconciliationExport, ReconciliationError>>
  // ── Conta-cedente (#138) ──
  listAccounts: () => Promise<Result<readonly ReconciliationAccount[], ReconciliationError>>
  getAccount: (id: string) => Promise<Result<ReconciliationAccount, ReconciliationError>>
  createAccount: (i: CreateCedenteAccountInput) => Promise<Result<ReconciliationAccount, ReconciliationError>>
}>

type UndoReconciliationInput = Readonly<{ reconciliationId: string; reason?: string }>

export const createReconciliationRepository = (
  deps: Readonly<{
    importStatementFn: ImportFn
    listTransactionsFn: ListTxFn
    listPaidPayablesFn: ListPayablesFn
    listReferencesFn: ListReferencesFn
    getAccountStatementPeriodFn: GetStatementPeriodFn
    getSuggestionsFn: SuggestionsFn
    getStatementSuggestionsFn: StatementSuggestionsFn
    getTransactionReconciliationFn: GetTxReconFn
    rejectSuggestionFn: RejectFn
    createReconciliationFn: ReconcileFn
    undoReconciliationFn: UndoFn
    createManualEntryFn: ManualFn
    batchReconcileFn: BatchFn
    closePeriodFn: CloseFn
    reopenPeriodFn: ReopenFn
    listReconciliationPeriodsFn: ListPeriodsFn
    exportReconciliationFn: ExportFn
    listAccountsFn: ListAccountsFn
    getAccountFn: GetAccountFn
    createAccountFn: CreateAccountFn
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
  getReferences: async () => {
    const res = await deps.listReferencesFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
  getAccountStatementPeriod: async (i) => {
    const res = await deps.getAccountStatementPeriodFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getSuggestions: async (i) => {
    const res = await deps.getSuggestionsFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getStatementSuggestions: async (i) => {
    const res = await deps.getStatementSuggestionsFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getTransactionReconciliation: async (transactionId) => {
    const res = await deps.getTransactionReconciliationFn({ data: { transactionId } })
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
  reopenPeriod: async (i) => {
    const res = await deps.reopenPeriodFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
  listReconciliationPeriods: async (debitAccountRef) => {
    const res = await deps.listReconciliationPeriodsFn({ data: { debitAccountRef } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  exportReconciliation: async (i) => {
    const res = await deps.exportReconciliationFn({ data: i })
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
  createAccount: async (i) => {
    const res = await deps.createAccountFn({ data: i })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
