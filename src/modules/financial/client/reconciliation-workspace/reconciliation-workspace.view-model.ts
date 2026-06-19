/**
 * View-model do workspace de Conciliação (§XI: lógica fora da view; sem React). UI-state como máquina
 * tagged + reducer PURO (testável em node:test) e derivações puras (agrupar por dia, filtro, ícone por
 * `entryType`, progresso, rótulos). As queries de dados entram via o binding. Espelha o padrão de
 * `contas-a-pagar.view-model.ts` (derivação pura) + reducer de UI-state.
 */
import type {
  Movement,
  StatementTransaction,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

// Re-export p/ as views (ui) formatarem dinheiro sem importar de client/data (boundary §I).
export { centsToBRL } from '#modules/financial/client/data/money.ts'

// Re-export dos tipos de model p/ as views tiparem sem importar de client/data (boundary §I).
export type {
  StatementTransaction,
  BankStatementImport,
  Movement,
  PaidPayable,
  DifferenceTreatment,
  ManualEntryType,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

// ── UI-state (server-state ≠ UI-state, §XI) ─────────────────────────────────────
export type WorkspaceTab = 'extrato' | 'conciliacao'
export type ListFilter = 'pendentes' | 'conciliadas' | 'todas'
export type AssocTab = 'sugestao' | 'nova' | 'multi'
export type ExtratoFilter = 'todos' | 'entradas' | 'saidas' | 'conciliados' | 'pendentes'

export type WorkspaceUiState = Readonly<{
  activeTab: WorkspaceTab
  showGuesses: boolean
  listFilter: ListFilter
  selectedTransactionId: string | null
  assocTab: AssocTab
  extratoFilter: ExtratoFilter
  // statementId do extrato importado nesta sessão (não há endpoint p/ listar extratos → ephemeral).
  statementId: string | null
}>

export const initialWorkspaceUiState: WorkspaceUiState = {
  activeTab: 'conciliacao',
  showGuesses: true,
  listFilter: 'pendentes',
  selectedTransactionId: null,
  assocTab: 'sugestao',
  extratoFilter: 'todos',
  statementId: null,
}

export type WorkspaceAction =
  | Readonly<{ type: 'set-tab'; tab: WorkspaceTab }>
  | Readonly<{ type: 'toggle-guesses' }>
  | Readonly<{ type: 'set-list-filter'; filter: ListFilter }>
  | Readonly<{ type: 'select-transaction'; id: string | null }>
  | Readonly<{ type: 'set-assoc-tab'; tab: AssocTab }>
  | Readonly<{ type: 'set-extrato-filter'; filter: ExtratoFilter }>
  | Readonly<{ type: 'set-statement'; statementId: string }>

export const workspaceReducer = (state: WorkspaceUiState, action: WorkspaceAction): WorkspaceUiState => {
  switch (action.type) {
    case 'set-tab':
      return { ...state, activeTab: action.tab }
    case 'toggle-guesses':
      return { ...state, showGuesses: !state.showGuesses }
    case 'set-list-filter':
      return { ...state, listFilter: action.filter }
    case 'select-transaction':
      // Selecionar uma transação volta a aba de associação para a Sugestão (caminho feliz).
      return { ...state, selectedTransactionId: action.id, assocTab: 'sugestao' }
    case 'set-assoc-tab':
      return { ...state, assocTab: action.tab }
    case 'set-extrato-filter':
      return { ...state, extratoFilter: action.filter }
    case 'set-statement':
      // Novo extrato importado: zera a seleção (as transações mudam).
      return { ...state, statementId: action.statementId, selectedTransactionId: null }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

// ── Derivações puras ────────────────────────────────────────────────────────────
/** Rótulo do progresso "conciliado X/N". */
export const progressLabel = (reconciled: number, total: number): string =>
  `${String(reconciled)}/${String(total)}`

/** Percentual conciliado (0..100, inteiro), para a barra. Total 0 → 0. */
export const progressPercent = (reconciled: number, total: number): number => {
  if (total <= 0) return 0
  const pct = Math.round((reconciled / total) * 100)
  return Math.max(0, Math.min(100, pct))
}

// ── Derivações da lista de transações (puras) ───────────────────────────────────

/**
 * Ícone da transação. `entryType` é **string livre** (#152) — heurística sobre o código normalizado, com
 * fallback por `movement` (entrada/saída). Nunca um union fechado.
 */
export type TxIconKind = 'in' | 'out' | 'transfer' | 'fee' | 'investment'
export const entryTypeIcon = (entryType: string, movement: Movement): TxIconKind => {
  const e = entryType.toUpperCase()
  if (e.includes('FEE') || e.includes('TAR') || e.includes('INT') || e.includes('JUR')) return 'fee'
  if (e.includes('XFER') || e.includes('TED') || e.includes('DOC')) return 'transfer'
  if (e.includes('APLIC') || e.includes('INVEST') || e.includes('RESG') || e.includes('REDEM'))
    return 'investment'
  return movement === 'Credit' ? 'in' : 'out'
}

/** É pendente de conciliação? (só `Pending`; `Reconciled`/`ManualEntry` = tratada.) */
export const isPending = (tx: StatementTransaction): boolean => tx.reconciliationStatus === 'Pending'

/**
 * Tag da linha na lista. O contrato não tem endpoint de sugestões em lote (são por transação), então a
 * lista mostra `reconciled`/`pending`; a banda (alta/média/sem match) aparece no painel da transação
 * selecionada (onde as sugestões são buscadas). Ver chrome-gaps (palpite por linha = lacuna de backend).
 */
export type ListTag = 'reconciled' | 'pending'
export const transactionTag = (tx: StatementTransaction): ListTag =>
  isPending(tx) ? 'pending' : 'reconciled'

/** Aplica o filtro da lista (Pendentes/Conciliadas/Todas). */
export const filterTransactions = (
  txs: readonly StatementTransaction[],
  filter: ListFilter,
): readonly StatementTransaction[] => {
  switch (filter) {
    case 'pendentes':
      return txs.filter(isPending)
    case 'conciliadas':
      return txs.filter((t) => !isPending(t))
    case 'todas':
      return txs
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

/** Agrupa transações por dia (`date`, ISO), preservando a ordem de chegada dentro do dia. */
export type DayGroup = Readonly<{ date: string; items: readonly StatementTransaction[] }>
export const groupTransactionsByDay = (txs: readonly StatementTransaction[]): readonly DayGroup[] => {
  const order: string[] = []
  const byDay = new Map<string, StatementTransaction[]>()
  for (const t of txs) {
    const bucket = byDay.get(t.date)
    if (bucket === undefined) {
      byDay.set(t.date, [t])
      order.push(t.date)
    } else {
      bucket.push(t)
    }
  }
  return order.map((date) => ({ date, items: byDay.get(date) ?? [] }))
}

/** Conta as transações já tratadas (não-pendentes) — alimenta o progresso "X/N". */
export const countReconciled = (txs: readonly StatementTransaction[]): number =>
  txs.filter((t) => !isPending(t)).length

// ── Balanceamento da conciliação N:1 / parcial (puro — US3) ─────────────────────

/** String de centavos → inteiro (defensivo: vazio/NaN → 0). */
export const parseCents = (s: string): number => {
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : 0
}

/** Soma (em centavos) dos títulos selecionados. */
export const sumCentsOf = (payables: readonly { valueCents: string }[]): number =>
  payables.reduce((acc, p) => acc + parseCents(p.valueCents), 0)

/**
 * Diferença residual (centavos) = valor do extrato − soma dos títulos. 0 → bate exatamente; ≠ 0 → exige
 * classificação (Juros/Multa/Desconto/Tarifa/Parcial). Pode ser negativa (selecionou além do valor).
 */
export const residualCents = (txValueCents: number, selectedSumCents: number): number =>
  txValueCents - selectedSumCents

/**
 * Pode conciliar (gating do botão): ≥1 título selecionado E (bate exatamente OU a diferença foi
 * classificada). O backend revalida (422 reconciliation-not-balanced), mas a UI nunca deixa enviar
 * desbalanceado (SC-004).
 */
export const canReconcileMulti = (selectedCount: number, residual: number, hasTreatment: boolean): boolean =>
  selectedCount >= 1 && (residual === 0 || hasTreatment)

/** Tipo derivado (espelha o backend `deriveType`): com diferença → Partial; senão 1→Individual, ≥2→Multiple. */
export type ReconType = 'Individual' | 'Multiple' | 'Partial'
export const deriveReconType = (selectedCount: number, hasDifference: boolean): ReconType =>
  hasDifference ? 'Partial' : selectedCount > 1 ? 'Multiple' : 'Individual'

/** Tipos de lançamento manual que exigem conta de destino + confirmação consciente (US4). */
export const requiresDestination = (type: string): boolean =>
  type === 'Transfer' || type === 'Investment' || type === 'Redemption'

// ── Aba Extrato (puro — US8) ────────────────────────────────────────────────────

/** Aplica o filtro do extrato (Todos/Entradas/Saídas/Conciliados/Pendentes). */
export const filterExtrato = (
  txs: readonly StatementTransaction[],
  filter: ExtratoFilter,
): readonly StatementTransaction[] => {
  switch (filter) {
    case 'todos':
      return txs
    case 'entradas':
      return txs.filter((t) => t.movement === 'Credit')
    case 'saidas':
      return txs.filter((t) => t.movement === 'Debit')
    case 'conciliados':
      return txs.filter((t) => !isPending(t))
    case 'pendentes':
      return txs.filter(isPending)
    default: {
      const _exhaustive: never = filter
      return _exhaustive
    }
  }
}

/** Totais do extrato (centavos): entradas (Credit) e saídas (Debit). */
export type ExtratoTotals = Readonly<{ inCents: number; outCents: number }>
export const extratoTotals = (txs: readonly StatementTransaction[]): ExtratoTotals => ({
  inCents: txs.filter((t) => t.movement === 'Credit').reduce((a, t) => a + parseCents(t.valueCents), 0),
  outCents: txs.filter((t) => t.movement === 'Debit').reduce((a, t) => a + parseCents(t.valueCents), 0),
})
