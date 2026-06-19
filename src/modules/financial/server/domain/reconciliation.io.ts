/**
 * Conciliação Bancária — tipos de I/O do domínio (PUROS, sem Zod — §VI). Os schemas Zod vivem na borda
 * (`../adapters/reconciliation.io-schemas.ts` p/ input e `../adapters/core-api/reconciliation.schema.ts`
 * p/ response). Alinhado ao contrato REAL do core-api (`/api/v2/financial`, PR #152 — verificado no
 * código; ver `specs/034-bank-reconciliation/contracts/`). Espelha `document.io.ts`.
 *
 * Dinheiro trafega como **string de CENTAVOS** na borda; `difference.valueCents` é a única exceção: int
 * que **pode ser negativo** (ex.: Discount). `entryType` é **string LIVRE** (passthrough OFX/CSV), nunca
 * union — o ícone da UI sai de heurística + fallback por `movement`.
 */

// ── Enums fechados (uniões de literais — §VI) ───────────────────────────────────
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
export type SuggestionBand = 'alta' | 'media' // 'baixa' (<50) é filtrada pelo backend, nunca chega
export type StatementFormat = 'OFX' | 'CSV'

// ── Inputs (validados na server fn pelos schemas em adapters) ────────────────────
// Importar extrato (POST /bank-statements). `content` = arquivo OFX/CSV como texto.
export interface ImportStatementInput {
  debitAccountRef: string
  format: StatementFormat
  content: string
  fileName?: string
}

// Listar transações de um extrato (GET /bank-statements/:id/transactions).
export interface ListTransactionsInput {
  statementId: string
}

// Sugestões de uma transação (GET /statement-transactions/:id/suggestions).
export interface GetSuggestionsInput {
  transactionId: string
}

// Rejeitar uma sugestão (POST /statement-transactions/:id/reject-suggestion).
export interface RejectSuggestionInput {
  transactionId: string
  payableId: string
}

// Diferença na conciliação parcial. `valueCents` é int e PODE ser negativo (Discount).
export interface DifferenceInput {
  valueCents: number
  treatment: DifferenceTreatment
}

// Conciliar (POST /reconciliations). 1 título sem diferença → Individual; ≥2 → Multiple; com
// `difference` (qualquer treatment) → Partial (derivado pelo backend).
export interface CreateReconciliationInput {
  transactionId: string
  payableIds: readonly string[]
  difference?: DifferenceInput
}

// Desfazer (POST /reconciliations/:id/undo).
export interface UndoReconciliationInput {
  reconciliationId: string
  reason?: string
}

// Modelo de lançamento manual (compartilhado por manual-entry e batch.template). Valor derivado da
// transação. Transfer/Investment/Redemption exigem `destinationAccount` (gating consciente na UI).
export interface ManualEntryTemplate {
  type: ManualEntryType
  supplierRef?: string
  categoryRef?: string
  costCenterRef?: string
  programRef?: string
  description?: string
  destinationAccount?: string
}

// Lançamento manual (POST /statement-transactions/:id/manual-entry).
export interface ManualEntryInput extends ManualEntryTemplate {
  transactionId: string
}

// Lote (POST /reconciliations/batch) — best-effort.
export interface BatchReconcileInput {
  transactionIds: readonly string[]
  template: ManualEntryTemplate
}

// Fechar período (POST /reconciliation-periods/close).
export interface ClosePeriodInput {
  debitAccountRef: string
  periodStart: string
  periodEnd: string
}

// ── Outputs (Model que a UI consome) ────────────────────────────────────────────
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
  date: string // YYYY-MM-DD
  movement: Movement
  entryType: string // LIVRE — não enum
  payeeName: string
  memo: string
  valueCents: string
  balanceAfterCents: string
  reconciliationStatus: ReconciliationStatus
}>

// Conta-cedente da organização (#138 — GET /cedente-accounts). Saldo corrente, lastUpdated e pendingCount
// dependem do read-model #139 → defaults até lá.
export type CedenteAccount = Readonly<{
  id: string
  bankCode: string
  bankName: string
  branch: string
  accountNumber: string
  accountDv: string
  alias: string
  type: 'Corrente' | 'Poupanca' | 'Investimento'
  status: 'Active' | 'Closed'
  currentBalanceCents: string
  lastUpdatedAt: string
  pendingCount: number
}>

// Criar conta-cedente (#138). `document` = CNPJ (obrigatório). type = AccountType do front (mapeado p/
// minúsculo na borda do core-api). Saldo de abertura opcional (centavos).
export type CreateCedenteAccountInput = Readonly<{
  bankCode: string
  bankName?: string
  type: 'Corrente' | 'Poupanca' | 'Investimento'
  agency: string
  accountNumber: string
  accountDigit: string
  document: string
  nickname?: string
  openingBalanceCents?: string
  openingBalanceDate?: string
}>

// Título conciliável (só Pago). `supplierName`/`documentNumber` chegam quando core-api#172 enriquecer.
export type PaidPayable = Readonly<{
  id: string
  documentId: string
  valueCents: string
  dueDate: string // date-only YYYY-MM-DD
  paymentMethod: string
  supplierName: string | null
  documentNumber: string | null
  category: string | null // core-api#172: categoria do título (coluna Categoria)
  documentType: string | null // core-api#172: tipo de documento (NFS-e/DANFE/IRRF/CSRF/INSS…) p/ filtro Tipo
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
  score: number // 0..100
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
