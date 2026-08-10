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

// ── Pagamentos conciliados por contrato (o módulo Contratos consome p/ o Histórico de Pagamento, §I) ──
export {
  contractPaymentsQueryOptions,
  reconciledGrossByContractQueryOptions,
  type ContractPayment,
} from '#modules/financial/client/contas-a-pagar-list/contract-payments.query.ts'

// ── Referências de categorização (Centro de Custo + Categoria) — consumidas cross-módulo (ex.: Contratos §I) ──
export { listFinancialReferencesFn } from '#modules/financial/server/adapters/server-fns/list-financial-references.query.fn.ts'
export type { FinancialReferences } from '#modules/financial/client/data/model/reconciliation.model.ts'

// ── Contas-cedente (contas bancárias da org, #138) — lista consumida cross-módulo (ex.: filtro dos Relatórios §I) ──
export { listCedenteAccountsFn } from '#modules/financial/server/adapters/server-fns/list-cedente-accounts.query.fn.ts'
export type { CedenteAccount } from '#modules/financial/server/domain/reconciliation.io.ts'

// ── Cascata PURA da árvore do plano (#502/ADR-0051) — Centro→Categoria→Subcategoria a partir do PlanDetail.
// Compartilhada cross-módulo (Contratos §I) para a categorização planejável ficar idêntica em toda tela.
export {
  planCostCenterOptions,
  planCategoryOptions,
  planSubcategoryOptions,
  type TaxonomyOption,
} from '#modules/financial/client/data/helpers/plan-taxonomy-cascade.ts'

// ── Cascata de categorização dirigida pelo PLANO (ADR-0051) — HOOKS React consumidos cross-módulo (Relatórios §I).
// Centro/Categoria/Subcategoria vêm da ÁRVORE do plano selecionado (UUID); sem plano caem no catálogo operacional.
// Regra ÚNICA (a mesma do "Lançar Documento") — zero duplicação; já tratam loading/erro → [].
export {
  useCostCenterOptionsFromPlan,
  useCategoryOptionsFromPlan,
  useSubcategoryOptionsFromPlan,
  type CategoryOption,
} from '#modules/financial/client/document-create/category-options.binding.ts'
