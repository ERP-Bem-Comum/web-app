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
export type AccountType = 'Corrente' | 'Poupanca' | 'Investimento'
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
  dueDate: string
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
export type MatchSuggestion = Readonly<{
  payableId: string
  score: number
  band: SuggestionBand
  criteria: SuggestionCriteria
}>
export type RejectedSuggestion = Readonly<{ transactionId: string; payableId: string }>
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
