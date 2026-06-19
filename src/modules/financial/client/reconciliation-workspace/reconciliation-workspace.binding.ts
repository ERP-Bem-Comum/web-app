/**
 * Binding do workspace de Conciliação — ADAPTER React (UI-state + queries + import + conciliação). Owns o
 * `useReducer` do UI-state, o seletor de conta (placeholder #168) e as queries (transações/títulos Pago/
 * sugestões). Deriva, via a view-model PURA, a lista agrupada por dia, o progresso e a "visão de match" da
 * transação selecionada. A page e os componentes são burros (só consomem este hook). US1 (conciliar por
 * sugestão) + US2 (importar) ligados; US3–US8 entram nas próximas fatias.
 */
import { useReducer } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  countReconciled,
  filterTransactions,
  groupTransactionsByDay,
  initialWorkspaceUiState,
  isPending,
  progressLabel,
  progressPercent,
  workspaceReducer,
  type AssocTab,
  type DayGroup,
  type ListFilter,
  type WorkspaceTab,
  type WorkspaceUiState,
} from './reconciliation-workspace.view-model.ts'
import { useAccountSelector } from './account-selector.binding.ts'
import { useImport, type ImportBinding } from './import.binding.ts'
import { useReconcile, type ReconcileBinding } from './reconcile.binding.ts'
import {
  paidPayablesQueryOptions,
  suggestionsQueryOptions,
  transactionsQueryOptions,
} from './reconciliation-workspace.query.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type {
  MatchSuggestion,
  PaidPayable,
  StatementTransaction,
  SuggestionBand,
  SuggestionCriteria,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

export type TxListState =
  | Readonly<{ tag: 'idle' }> // nenhum extrato importado nesta sessão
  | Readonly<{ tag: 'loading' }>
  | Readonly<{ tag: 'error'; errorTag: string }>
  | Readonly<{ tag: 'empty' }>
  | Readonly<{ tag: 'ready'; groups: readonly DayGroup[] }>

export type FilterCounts = Readonly<{ pendentes: number; conciliadas: number; todas: number }>

export type MatchView = Readonly<{
  payableId: string
  score: number
  band: SuggestionBand
  criteria: SuggestionCriteria
  payable: PaidPayable | null // mínimo até #172; null se não estiver na lista de Pagos
}>

export type SuggestionState =
  | Readonly<{ tag: 'idle' }> // nenhuma transação selecionada
  | Readonly<{ tag: 'loading' }>
  | Readonly<{ tag: 'error'; errorTag: string }>
  | Readonly<{ tag: 'none' }> // sem palpite
  | Readonly<{ tag: 'ready'; top: MatchView; alternatives: readonly MatchView[] }>

export type WorkspaceBinding = Readonly<{
  accountRef: string
  identityAvailable: boolean
  ui: WorkspaceUiState
  progress: Readonly<{ label: string; percent: number; reconciled: number; total: number }>
  txList: TxListState
  filterCounts: FilterCounts
  selectedTx: StatementTransaction | null
  suggestions: SuggestionState
  import: ImportBinding
  reconcile: ReconcileBinding
  setTab: (tab: WorkspaceTab) => void
  toggleGuesses: () => void
  setListFilter: (filter: ListFilter) => void
  selectTransaction: (id: string | null) => void
  setAssocTab: (tab: AssocTab) => void
}>

const toMatchView = (s: MatchSuggestion, payables: ReadonlyMap<string, PaidPayable>): MatchView => ({
  payableId: s.payableId,
  score: s.score,
  band: s.band,
  criteria: s.criteria,
  payable: payables.get(s.payableId) ?? null,
})

export function useReconciliationWorkspace(routeAccountRef: string): WorkspaceBinding {
  const [ui, dispatch] = useReducer(workspaceReducer, initialWorkspaceUiState)
  const { accountRef, identityAvailable } = useAccountSelector(routeAccountRef)

  const txQuery = useQuery(transactionsQueryOptions(ui.statementId))
  const payablesQuery = useQuery(paidPayablesQueryOptions())
  const suggestionsQuery = useQuery(suggestionsQueryOptions(ui.selectedTransactionId))

  const importBinding = useImport(accountRef, (statementId) => {
    dispatch({ type: 'set-statement', statementId })
  })
  const reconcileBinding = useReconcile()

  // ── Lista de transações (server-state → estado da tela via view-model pura) ──
  const allTx: readonly StatementTransaction[] = txQuery.data?.ok === true ? txQuery.data.value : []
  const filterCounts: FilterCounts = {
    pendentes: allTx.filter(isPending).length,
    conciliadas: allTx.filter((t) => !isPending(t)).length,
    todas: allTx.length,
  }

  const txList: TxListState = (() => {
    if (ui.statementId === null) return { tag: 'idle' }
    if (txQuery.isLoading) return { tag: 'loading' }
    if (txQuery.data?.ok === false)
      return { tag: 'error', errorTag: reconciliationErrorTag(txQuery.data.error) }
    if (allTx.length === 0) return { tag: 'empty' }
    const groups = groupTransactionsByDay(filterTransactions(allTx, ui.listFilter))
    return { tag: 'ready', groups }
  })()

  const selectedTx =
    ui.selectedTransactionId === null ? null : (allTx.find((t) => t.id === ui.selectedTransactionId) ?? null)

  // ── Sugestões da transação selecionada (join com Pagos; rejeitadas filtradas) ──
  const payablesMap: ReadonlyMap<string, PaidPayable> = new Map(
    (payablesQuery.data?.ok === true ? payablesQuery.data.value : []).map((p) => [p.id, p]),
  )

  const suggestions: SuggestionState = (() => {
    if (ui.selectedTransactionId === null) return { tag: 'idle' }
    if (suggestionsQuery.isLoading) return { tag: 'loading' }
    if (suggestionsQuery.data?.ok === false)
      return { tag: 'error', errorTag: reconciliationErrorTag(suggestionsQuery.data.error) }
    const selId = ui.selectedTransactionId
    const list = (suggestionsQuery.data?.ok === true ? suggestionsQuery.data.value : [])
      .filter((s) => !reconcileBinding.isRejected(selId, s.payableId))
      .slice()
      .sort((a, b) => b.score - a.score)
    const top = list[0]
    if (top === undefined) return { tag: 'none' }
    return {
      tag: 'ready',
      top: toMatchView(top, payablesMap),
      alternatives: list.slice(1).map((s) => toMatchView(s, payablesMap)),
    }
  })()

  const reconciled = countReconciled(allTx)
  const total = allTx.length

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
    txList,
    filterCounts,
    selectedTx,
    suggestions,
    import: importBinding,
    reconcile: reconcileBinding,
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
