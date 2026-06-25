/**
 * Model do client (client-data) — tipos de I/O do repository da Conciliação Bancária, espelhando
 * `reconciliation.io.ts`. Tipos locais (não importa server/domain — boundary §I). Money = string de
 * centavos; `difference.valueCents` = int (pode negativo); `entryType` = string LIVRE.
 * `supplierName`/`documentNumber` = mínimo até core-api#172. `ReconciliationAccount` depende de #168.
 */

// ── Enums fechados ──
export type Movement = 'Debit' | 'Credit'
export type ReconciliationStatus = 'Pending' | 'Reconciled' | 'ManualEntry'
export type ReconciliationType = 'Individual' | 'Multiple' | 'Partial'
export type DifferenceTreatment = 'Interest' | 'Penalty' | 'Discount' | 'Fee' | 'Partial'
export type ManualEntryType =
  | 'Payment'
  | 'Receipt'
  | 'Transfer'
  | 'FeePenaltyInterest'
  | 'Investment'
  | 'Redemption'
export type SuggestionBand = 'alta' | 'media'
export type StatementFormat = 'OFX' | 'CSV'

// Conta-cedente (depende de core-api#168; sem endpoint hoje). `status` Closed não abre workspace.
export type AccountType = 'Corrente' | 'Poupanca' | 'Investimento' | 'Cartao' | 'Outro'
export type AccountStatus = 'Active' | 'Closed'
export type ReconciliationAccount = Readonly<{
  id: string
  bankCode: string
  bankName: string
  branch: string
  accountNumber: string
  accountDv: string
  alias: string
  type: AccountType
  typeLabel: string | null // #206: texto livre quando type = Cartao/Outro
  status: AccountStatus
  currentBalanceCents: string
  lastUpdatedAt: string
  pendingCount: number
}>

// ── Inputs enviados pelo repository (a server fn valida no server) ──
export type ImportStatementInput = Readonly<{
  debitAccountRef: string
  format: StatementFormat
  content: string
  fileName?: string
}>
export type ListTransactionsInput = Readonly<{ statementId: string }>
export type GetSuggestionsInput = Readonly<{ transactionId: string }>
export type GetStatementSuggestionsInput = Readonly<{ statementId: string }>
// Criar conta-cedente (#138). `document` = CNPJ da organização (obrigatório no core-api). Saldo de
// abertura opcional (já em centavos). type = AccountType do front (mapeado p/ minúsculo na borda).
// #205: saldo do PERÍODO do extrato (abertura acumulada até `from` + fechamento + entradas/saídas).
export type StatementFilter = 'all' | 'in' | 'out' | 'reconciled' | 'pending'
export type GetAccountStatementInput = Readonly<{
  accountId: string
  from: string
  to: string
  filter?: StatementFilter
}>
export type StatementPeriodCounters = Readonly<{
  all: number
  in: number
  out: number
  reconciled: number
  pending: number
}>
export type AccountStatementPeriod = Readonly<{
  openingBalanceCents: string
  closingBalanceCents: string
  totalInCents: string
  totalOutCents: string
  // #205: movimentos do período (linhas com saldo corrente por linha) + contadores p/ a aba Extrato.
  counters: StatementPeriodCounters
  movements: readonly StatementTransaction[]
}>

export type CreateCedenteAccountInput = Readonly<{
  bankCode: string
  bankName?: string
  type: AccountType
  typeLabel?: string // #206: texto livre p/ Cartao/Outro
  agency: string
  accountNumber: string
  accountDigit: string
  document: string
  nickname?: string
  openingBalanceCents?: string
  openingBalanceDate?: string
}>
export type RejectSuggestionInput = Readonly<{ transactionId: string; payableId: string }>
export type DifferenceInput = Readonly<{ valueCents: number; treatment: DifferenceTreatment }>
export type CreateReconciliationInput = Readonly<{
  transactionId: string
  payableIds: readonly string[]
  difference?: DifferenceInput
}>
export type UndoReconciliationInput = Readonly<{ reconciliationId: string; reason?: string }>
export type ManualEntryTemplate = Readonly<{
  type: ManualEntryType
  supplierRef?: string
  categoryRef?: string
  costCenterRef?: string
  programRef?: string
  description?: string
  destinationAccount?: string
}>
export type ManualEntryInput = ManualEntryTemplate & Readonly<{ transactionId: string }>
export type BatchReconcileInput = Readonly<{
  transactionIds: readonly string[]
  template: ManualEntryTemplate
}>
export type ClosePeriodInput = Readonly<{
  debitAccountRef: string
  periodStart: string
  periodEnd: string
}>
export type ReopenPeriodInput = Readonly<{ periodId: string }> // #203

// ── Outputs (Model que a UI consome) ──
export type StatementPeriod = Readonly<{ start: string; end: string }>
export type BankStatementImport = Readonly<{
  statementId: string
  imported: number
  duplicatesDiscarded: number
  period: StatementPeriod
}>
export type StatementTransaction = Readonly<{
  id: string
  fitid: string
  date: string
  movement: Movement
  entryType: string
  payeeName: string
  memo: string
  valueCents: string
  balanceAfterCents: string
  reconciliationStatus: ReconciliationStatus
}>
export type PaidPayable = Readonly<{
  id: string
  documentId: string
  valueCents: string
  dueDate: string // date-only YYYY-MM-DD
  // Data de PAGAMENTO (baixa) — a data relevante p/ a conciliação (≈ saída bancária). null enquanto o
  // backend não a expõe nesta rota (core-api: /financial/payables não monta paidAt — core-api#265).
  paidAt: string | null
  paymentMethod: string
  supplierName: string | null
  documentNumber: string | null
  // Categoria (ex.: "Serviços / Consultoria", "Imposto / ISS") = mínimo até core-api#172 (coluna Categoria).
  category: string | null
  // Tipo de DOCUMENTO (ex.: "NFS-e", "DANFE", "IRRF", "CSRF", "INSS", "ISS") = mínimo até core-api#172;
  // alimenta o filtro Tipo na aba Buscar/Criar vários (achar impostos retidos: IRRF/CSRF/INSS…).
  documentType: string | null
}>
export type SuggestionCriteria = Readonly<{
  payeeMatch: boolean
  exactValue: boolean
  dateD0: boolean
  memoRef: boolean
  supplierOpenCount: number
}>
// Breakdown ponderado dos critérios (#140): peso + resultado por critério p/ os chips (ok|parcial|falha).
// `detail` só preenchido em `supplierOpen` (count como string). Espelha `reconciliation.io.ts`.
export type CriterionKey = 'exactValue' | 'payeeMatch' | 'dateD0' | 'memoRef' | 'supplierOpen'
export type CriterionOutcome = 'ok' | 'parcial' | 'falha'
export type CriterionResult = Readonly<{
  criterion: CriterionKey
  weight: number
  result: CriterionOutcome
  detail: string
}>
export type MatchSuggestion = Readonly<{
  payableId: string
  score: number
  band: SuggestionBand
  criteria: SuggestionCriteria
  criteriaBreakdown: readonly CriterionResult[] // #140; vazio = backend antigo (fallback p/ chips booleanos)
}>
// Palpite de topo por transação em lote (#174). null = transação não-Pending ou sem candidato → o grid da
// aba Conciliação pinta a banda por linha sem N requisições de detalhe.
export type StatementSuggestion = Readonly<{
  transactionId: string
  topBand: SuggestionBand | null
  topScore: number | null
}>
export type RejectedSuggestion = Readonly<{ transactionId: string; payableId: string }>
// Conciliação ativa de uma transação (#175). `null` no repository = sem conciliação ativa. Itens trazem
// só payableId+valor conciliado (sem fornecedor/nº doc até #172).
export type TransactionReconciliationItem = Readonly<{
  payableId: string
  reconciledValueCents: string
}>
export type TransactionReconciliation = Readonly<{
  reconciliationId: string
  transactionId: string
  type: 'Individual' | 'Multiple' | 'Partial' | 'ManualEntry'
  status: 'Active' | 'Undone'
  reconciledBy: string
  reconciledAt: string // ISO datetime
  differenceCents: string | null
  items: readonly TransactionReconciliationItem[]
}>
export type ReconciliationCreated = Readonly<{
  reconciliationId: string
  type: ReconciliationType
  itemCount: number
}>
export type ReconciliationUndone = Readonly<{ reconciliationId: string; status: 'Undone' }>
export type ManualEntryCreated = Readonly<{
  reconciliationId: string
  type: 'ManualEntry'
  manualEntryId: string
}>
export type BatchFailure = Readonly<{ transactionId: string; error: string }>
export type BatchResult = Readonly<{
  created: number
  reconciliationIds: readonly string[]
  failed: readonly BatchFailure[]
}>
export type PeriodClosed = Readonly<{ periodId: string; status: 'Closed' }>
export type PeriodReopened = Readonly<{ periodId: string; status: 'Open' }> // #203
// Período de conciliação (#173). `id` = periodId p/ exportar. Datas date-only.
export type ReconciliationPeriod = Readonly<{
  id: string
  debitAccountRef: string
  periodStart: string
  periodEnd: string
  status: 'Open' | 'Closed'
  closedAt: string | null
  closedBy: string | null
}>
// Export real (#173). `format` minúsculo. Conteúdo = texto cru OFX/CSV. PDF fica fora (#145).
export type ExportFormat = 'ofx' | 'csv'
export type ListReconciliationPeriodsInput = Readonly<{ debitAccountRef: string }>
export type ExportReconciliationInput = Readonly<{ periodId: string; format: ExportFormat }>
export type ReconciliationExport = Readonly<{ content: string; format: ExportFormat }>

// Dados de referência da categorização (020 · #200/#147). `parentId` = subcategoria (null = top-level).
export type FinancialCategory = Readonly<{
  id: string
  name: string
  group: 'despesa' | 'receita' | 'ajuste'
  parentId: string | null
}>
export type FinancialCostCenter = Readonly<{ id: string; code: string; name: string }>
export type FinancialReferences = Readonly<{
  categories: readonly FinancialCategory[]
  costCenters: readonly FinancialCostCenter[]
}>
