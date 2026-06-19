/**
 * Use-cases da Conciliação Bancária (application) — thin sobre a borda; sem I/O direto (o client é
 * injetado). Result em tudo (§II). `ReconciliationClient` é a porta — implementada em adapters
 * (`core-api-reconciliation.ts`). Espelha `financial.use-cases.ts`.
 */
import type { Result } from '#shared/primitives/result.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'
import type {
  BankStatementImport,
  BatchReconcileInput,
  BatchResult,
  CedenteAccount,
  CreateCedenteAccountInput,
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
  ReconciliationCreated,
  ReconciliationUndone,
  RejectSuggestionInput,
  RejectedSuggestion,
  StatementTransaction,
  UndoReconciliationInput,
} from '#modules/financial/server/domain/reconciliation.io.ts'

export type ReconciliationClient = Readonly<{
  importStatement: (
    i: ImportStatementInput,
    token: string,
  ) => Promise<Result<BankStatementImport, ReconciliationError>>
  listTransactions: (
    i: ListTransactionsInput,
    token: string,
  ) => Promise<Result<readonly StatementTransaction[], ReconciliationError>>
  listPaidPayables: (token: string) => Promise<Result<readonly PaidPayable[], ReconciliationError>>
  listCedenteAccounts: (token: string) => Promise<Result<readonly CedenteAccount[], ReconciliationError>>
  getCedenteAccount: (id: string, token: string) => Promise<Result<CedenteAccount, ReconciliationError>>
  createCedenteAccount: (
    i: CreateCedenteAccountInput,
    token: string,
  ) => Promise<Result<CedenteAccount, ReconciliationError>>
  getSuggestions: (
    i: GetSuggestionsInput,
    token: string,
  ) => Promise<Result<readonly MatchSuggestion[], ReconciliationError>>
  rejectSuggestion: (
    i: RejectSuggestionInput,
    token: string,
  ) => Promise<Result<RejectedSuggestion, ReconciliationError>>
  createReconciliation: (
    i: CreateReconciliationInput,
    token: string,
  ) => Promise<Result<ReconciliationCreated, ReconciliationError>>
  undoReconciliation: (
    i: UndoReconciliationInput,
    token: string,
  ) => Promise<Result<ReconciliationUndone, ReconciliationError>>
  createManualEntry: (
    i: ManualEntryInput,
    token: string,
  ) => Promise<Result<ManualEntryCreated, ReconciliationError>>
  batchReconcile: (i: BatchReconcileInput, token: string) => Promise<Result<BatchResult, ReconciliationError>>
  closePeriod: (i: ClosePeriodInput, token: string) => Promise<Result<PeriodClosed, ReconciliationError>>
}>

type Deps = Readonly<{ client: ReconciliationClient }>

export const createImportStatement =
  (deps: Deps) =>
  (i: ImportStatementInput, token: string): Promise<Result<BankStatementImport, ReconciliationError>> =>
    deps.client.importStatement(i, token)

export const createListTransactions =
  (deps: Deps) =>
  (
    i: ListTransactionsInput,
    token: string,
  ): Promise<Result<readonly StatementTransaction[], ReconciliationError>> =>
    deps.client.listTransactions(i, token)

export const createListPaidPayables =
  (deps: Deps) =>
  (token: string): Promise<Result<readonly PaidPayable[], ReconciliationError>> =>
    deps.client.listPaidPayables(token)

export const createListCedenteAccounts =
  (deps: Deps) =>
  (token: string): Promise<Result<readonly CedenteAccount[], ReconciliationError>> =>
    deps.client.listCedenteAccounts(token)

export const createGetCedenteAccount =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<CedenteAccount, ReconciliationError>> =>
    deps.client.getCedenteAccount(id, token)

export const createCreateCedenteAccount =
  (deps: Deps) =>
  (i: CreateCedenteAccountInput, token: string): Promise<Result<CedenteAccount, ReconciliationError>> =>
    deps.client.createCedenteAccount(i, token)

export const createGetSuggestions =
  (deps: Deps) =>
  (i: GetSuggestionsInput, token: string): Promise<Result<readonly MatchSuggestion[], ReconciliationError>> =>
    deps.client.getSuggestions(i, token)

export const createRejectSuggestion =
  (deps: Deps) =>
  (i: RejectSuggestionInput, token: string): Promise<Result<RejectedSuggestion, ReconciliationError>> =>
    deps.client.rejectSuggestion(i, token)

export const createCreateReconciliation =
  (deps: Deps) =>
  (
    i: CreateReconciliationInput,
    token: string,
  ): Promise<Result<ReconciliationCreated, ReconciliationError>> =>
    deps.client.createReconciliation(i, token)

export const createUndoReconciliation =
  (deps: Deps) =>
  (i: UndoReconciliationInput, token: string): Promise<Result<ReconciliationUndone, ReconciliationError>> =>
    deps.client.undoReconciliation(i, token)

export const createCreateManualEntry =
  (deps: Deps) =>
  (i: ManualEntryInput, token: string): Promise<Result<ManualEntryCreated, ReconciliationError>> =>
    deps.client.createManualEntry(i, token)

export const createBatchReconcile =
  (deps: Deps) =>
  (i: BatchReconcileInput, token: string): Promise<Result<BatchResult, ReconciliationError>> =>
    deps.client.batchReconcile(i, token)

export const createClosePeriod =
  (deps: Deps) =>
  (i: ClosePeriodInput, token: string): Promise<Result<PeriodClosed, ReconciliationError>> =>
    deps.client.closePeriod(i, token)
