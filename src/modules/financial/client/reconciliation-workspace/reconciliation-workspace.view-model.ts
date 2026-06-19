/**
 * View-model do workspace de Conciliação (§XI: lógica fora da view; sem React). UI-state como máquina
 * tagged + reducer PURO (testável em node:test) e derivações puras (progresso, rótulos). As queries de
 * dados (transações/sugestões/títulos) entram com US1/US2 via o binding. Espelha o padrão de
 * `contas-a-pagar.view-model.ts` (derivação pura) + reducer de UI-state.
 */

// ── UI-state (server-state ≠ UI-state, §XI) ─────────────────────────────────────
export type WorkspaceTab = 'extrato' | 'conciliacao'
export type ListFilter = 'pendentes' | 'conciliadas' | 'todas'
export type AssocTab = 'sugestao' | 'nova' | 'multi'

export type WorkspaceUiState = Readonly<{
  activeTab: WorkspaceTab
  showGuesses: boolean
  listFilter: ListFilter
  selectedTransactionId: string | null
  assocTab: AssocTab
}>

export const initialWorkspaceUiState: WorkspaceUiState = {
  activeTab: 'conciliacao',
  showGuesses: true,
  listFilter: 'pendentes',
  selectedTransactionId: null,
  assocTab: 'sugestao',
}

export type WorkspaceAction =
  | Readonly<{ type: 'set-tab'; tab: WorkspaceTab }>
  | Readonly<{ type: 'toggle-guesses' }>
  | Readonly<{ type: 'set-list-filter'; filter: ListFilter }>
  | Readonly<{ type: 'select-transaction'; id: string | null }>
  | Readonly<{ type: 'set-assoc-tab'; tab: AssocTab }>

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
