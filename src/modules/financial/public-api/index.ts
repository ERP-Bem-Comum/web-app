/**
 * Public API do módulo Financeiro / Contas a Pagar — ★ ÚNICO ponto de import externo (§I). Cresce por
 * slice: por ora exporta os tipos de model; as bindings/queryOptions das telas (Lançar Documento, Grid)
 * entram com US1/US2.
 */
export type {
  DocumentDetail,
  DocumentSummary,
  DocumentListResponse,
  Payable,
  DocumentType,
  DocumentStatus,
  PaymentMethod,
  RetentionType,
  RegisteredTaxType,
  CreateDocumentInput,
} from '#modules/financial/client/data/model/document.model.ts'
export type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

// ── Conciliação Bancária (034) — model + erro (a costura BFF/data; UI entra nas próximas fatias) ──
export type {
  ReconciliationAccount,
  AccountType,
  AccountStatus,
  Movement,
  ReconciliationStatus,
  ReconciliationType,
  DifferenceTreatment,
  ManualEntryType,
  SuggestionBand,
  StatementFormat,
  BankStatementImport,
  StatementTransaction,
  PaidPayable,
  MatchSuggestion,
  SuggestionCriteria,
  CriterionKey,
  CriterionOutcome,
  CriterionResult,
  StatementSuggestion,
  GetStatementSuggestionsInput,
  ReconciliationCreated,
  ReconciliationUndone,
  ManualEntryCreated,
  BatchResult,
  PeriodClosed,
  ImportStatementInput,
  CreateReconciliationInput,
  ManualEntryInput,
  ManualEntryTemplate,
  BatchReconcileInput,
  ClosePeriodInput,
} from '#modules/financial/client/data/model/reconciliation.model.ts'
export type { ReconciliationError } from '#modules/financial/client/data/repository/reconciliation-error.ts'
