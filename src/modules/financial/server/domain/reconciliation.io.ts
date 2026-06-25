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

// Palpite de topo por transação do extrato em lote (#174 — GET /bank-statements/:id/suggestions).
export interface GetStatementSuggestionsInput {
  statementId: string
}

// Conciliação ativa de uma transação (GET /statement-transactions/:id/reconciliation, #175).
export interface GetTransactionReconciliationInput {
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

// #203: reabrir período (Closed → Open). Só o periodId; o ator (reopenedBy) vem do servidor.
export interface ReopenPeriodInput {
  periodId: string
}

// Listar períodos de conciliação por conta (#173 — GET /reconciliation-periods?debitAccountRef=).
export interface ListReconciliationPeriodsInput {
  debitAccountRef: string
}

// Exportar conciliação de um período (GET /reconciliation-periods/:id/export?format=). `format` é
// minúsculo no core-api. Exporta período Open ou Closed (sem guard de status). PDF fica fora (#145).
export type ExportFormat = 'ofx' | 'csv'
export interface ExportReconciliationInput {
  periodId: string
  format: ExportFormat
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
  type: 'Corrente' | 'Poupanca' | 'Investimento' | 'Cartao' | 'Outro'
  typeLabel: string | null // #206: texto livre identificando a conta quando type = Cartao/Outro
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
  type: 'Corrente' | 'Poupanca' | 'Investimento' | 'Cartao' | 'Outro'
  typeLabel?: string // #206: texto livre p/ identificar conta Outro (ou complementar Cartao)
  agency: string
  accountNumber: string
  accountDigit: string
  document: string
  nickname?: string
  openingBalanceCents?: string
  openingBalanceDate?: string
}>

// Extrato por PERÍODO (#205 — GET /cedente-accounts/:id/statement?from&to). Input do read-model.
export type StatementFilter = 'all' | 'in' | 'out' | 'reconciled' | 'pending'
export interface GetAccountStatementInput {
  accountId: string
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
  filter?: StatementFilter
}

// Saldo do PERÍODO conciliado (#205): abertura = saldo acumulado ATÉ `from`; fechamento = ao fim do período.
// `totalIn/Out` somam as entradas/saídas dos dias do período (centavos). Base da faixa "saldo do período".
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
  // #205: movimentos do período + contadores (p/ a aba Extrato dirigida pelo período).
  counters: StatementPeriodCounters
  movements: readonly StatementTransaction[]
}>

// Título conciliável (só Pago). `supplierName`/`documentNumber` chegam quando core-api#172 enriquecer.
export type PaidPayable = Readonly<{
  id: string
  documentId: string
  valueCents: string
  dueDate: string // date-only YYYY-MM-DD
  paidAt: string | null // data de pagamento (baixa) — relevante p/ conciliação; null até o backend expor
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

// Breakdown ponderado dos critérios (#140): peso + resultado por critério, p/ a UI renderizar os chips
// (ok|parcial|falha) sem heurística própria. `detail` só preenchido em `supplierOpen` (count como string).
export type CriterionKey = 'exactValue' | 'payeeMatch' | 'dateD0' | 'memoRef' | 'supplierOpen'
export type CriterionOutcome = 'ok' | 'parcial' | 'falha'
export type CriterionResult = Readonly<{
  criterion: CriterionKey
  weight: number // 0..100
  result: CriterionOutcome
  detail: string
}>

export type MatchSuggestion = Readonly<{
  payableId: string
  score: number // 0..100
  band: SuggestionBand
  criteria: SuggestionCriteria
  criteriaBreakdown: readonly CriterionResult[] // #140; vazio se o backend não enviar (drift)
}>

// Palpite de topo por transação (#174). `topBand`/`topScore` = null quando a transação não é Pending ou
// não há candidato — o front pinta a banda por linha sem N requisições de detalhe.
export type StatementSuggestion = Readonly<{
  transactionId: string
  topBand: SuggestionBand | null
  topScore: number | null
}>

export type RejectedSuggestion = Readonly<{ transactionId: string; payableId: string }>

// Lookup da conciliação ativa por transação (#175 — GET /statement-transactions/:id/reconciliation).
// 404 no core-api = transação sem conciliação ativa → a borda devolve `null` (não é erro). `type` inclui
// 'ManualEntry'. Os itens trazem só `payableId`+valor conciliado (sem fornecedor/nº doc até #172).
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
  differenceCents: string | null // centavos; pode ser negativo (Discount); null se não houver diferença
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

// Período de conciliação (#173). `id` = periodId p/ exportar. Datas date-only. `closedAt` ISO ou null.
export type ReconciliationPeriod = Readonly<{
  id: string
  debitAccountRef: string
  periodStart: string // YYYY-MM-DD
  periodEnd: string // YYYY-MM-DD
  status: 'Open' | 'Closed'
  closedAt: string | null
  closedBy: string | null
}>

// Conteúdo exportado (texto cru OFX/CSV) + o formato pedido (p/ a UI nomear o arquivo / content-type).
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
