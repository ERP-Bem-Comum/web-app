/**
 * Binding do workspace de Conciliação — ADAPTER React (UI-state + costura de conta). Owns o `useReducer`
 * do UI-state e o seletor de conta (placeholder #168). A page é burra (só consome este hook). As queries
 * de dados (transações/sugestões/títulos) entram com US1/US2; por ora o progresso é 0/0.
 */
import { useReducer } from 'react'

import {
  initialWorkspaceUiState,
  progressLabel,
  progressPercent,
  workspaceReducer,
  type AssocTab,
  type ListFilter,
  type WorkspaceTab,
  type WorkspaceUiState,
} from './reconciliation-workspace.view-model.ts'
import { useAccountSelector } from './account-selector.binding.ts'

export type WorkspaceBinding = Readonly<{
  accountRef: string
  identityAvailable: boolean
  ui: WorkspaceUiState
  progress: Readonly<{ label: string; percent: number; reconciled: number; total: number }>
  setTab: (tab: WorkspaceTab) => void
  toggleGuesses: () => void
  setListFilter: (filter: ListFilter) => void
  selectTransaction: (id: string | null) => void
  setAssocTab: (tab: AssocTab) => void
}>

export function useReconciliationWorkspace(routeAccountRef: string): WorkspaceBinding {
  const [ui, dispatch] = useReducer(workspaceReducer, initialWorkspaceUiState)
  const { accountRef, identityAvailable } = useAccountSelector(routeAccountRef)

  // Progresso real entra com US1/US2 (depende das transações importadas). Por ora 0/0 (honesto).
  const reconciled = 0
  const total = 0

  return {
    accountRef,
    identityAvailable,
    ui,
    progress: {
      label: progressLabel(reconciled, total),
      percent: progressPercent(reconciled, total),
      reconciled,
      total,
    },
    setTab: (tab) => {
      dispatch({ type: 'set-tab', tab })
    },
    toggleGuesses: () => {
      dispatch({ type: 'toggle-guesses' })
    },
    setListFilter: (filter) => {
      dispatch({ type: 'set-list-filter', filter })
    },
    selectTransaction: (id) => {
      dispatch({ type: 'select-transaction', id })
    },
    setAssocTab: (tab) => {
      dispatch({ type: 'set-assoc-tab', tab })
    },
  }
}
