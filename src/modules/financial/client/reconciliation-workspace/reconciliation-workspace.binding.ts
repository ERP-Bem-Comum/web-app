/**
 * Binding do workspace de Conciliação — ADAPTER React (UI-state + queries + import + conciliação). Owns o
 * `useReducer` do UI-state, o seletor de conta (placeholder #168) e as queries (transações/títulos Pago/
 * sugestões). Deriva, via a view-model PURA, a lista agrupada por dia, o progresso e a "visão de match" da
 * transação selecionada. A page e os componentes são burros (só consomem este hook). US1 (conciliar por
 * sugestão) + US2 (importar) ligados; US3–US8 entram nas próximas fatias.
 */
import { useCallback, useReducer, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  countReconciled,
  extratoTotals,
  filterExtrato,
  filterTransactions,
  groupExtratoDays,
  groupTransactionsByDay,
  initialWorkspaceUiState,
  isPending,
  progressLabel,
  progressPercent,
  workspaceReducer,
  type AssocTab,
  type DayGroup,
  type ExtratoDayGroup,
  type ExtratoFilter,
  type ExtratoTotals,
  type ListFilter,
  type WorkspaceTab,
  type WorkspaceUiState,
} from './reconciliation-workspace.view-model.ts'
import { useAccountSelector } from './account-selector.binding.ts'
import { useImport, type ImportBinding } from './import.binding.ts'
import { useReconcile, type ReconcileBinding } from './reconcile.binding.ts'
import { useSearchCreate, type SearchCreateBinding } from './search-create.binding.ts'
import { useManualEntry, type ManualEntryBinding } from './manual-entry.binding.ts'
import { useUndo, type UndoBinding } from './undo.binding.ts'
import { useClosePeriod, type ClosePeriodBinding } from './close-period.binding.ts'
import {
  paidPayablesQueryOptions,
  suggestionsQueryOptions,
  transactionsQueryOptions,
} from './reconciliation-workspace.query.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type {
  MatchSuggestion,
  PaidPayable,
  ReconciliationAccount as ReconciliationAccountModel,
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
  account: ReconciliationAccountModel | null
  ui: WorkspaceUiState
  progress: Readonly<{ label: string; percent: number; reconciled: number; total: number }>
  txList: TxListState
  filterCounts: FilterCounts
  selectedTx: StatementTransaction | null
  suggestions: SuggestionState
  payables: readonly PaidPayable[]
  extrato: Readonly<{
    hasStatement: boolean
    days: readonly ExtratoDayGroup[]
    totals: ExtratoTotals
    count: number
    counts: Readonly<{
      todos: number
      entradas: number
      saidas: number
      conciliados: number
      pendentes: number
    }>
  }>
  import: ImportBinding
  reconcile: ReconcileBinding
  searchCreate: SearchCreateBinding
  manualEntry: ManualEntryBinding
  undo: UndoBinding
  closePeriod: ClosePeriodBinding
  /** id da conciliação feita NESTA sessão p/ a transação (null se desconhecido — Desfazer fica chrome). */
  reconciliationIdFor: (transactionId: string) => string | null
  setTab: (tab: WorkspaceTab) => void
  toggleGuesses: () => void
  setListFilter: (filter: ListFilter) => void
  setExtratoFilter: (filter: ExtratoFilter) => void
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
  const { accountRef, identityAvailable, account } = useAccountSelector(routeAccountRef)

  const txQuery = useQuery(transactionsQueryOptions(ui.statementId))
  const payablesQuery = useQuery(paidPayablesQueryOptions())
  const suggestionsQuery = useQuery(suggestionsQueryOptions(ui.selectedTransactionId))

  const importBinding = useImport(accountRef, (statementId) => {
    dispatch({ type: 'set-statement', statementId })
  })

  // Mapa de sessão transação→conciliação (o contrato não expõe o id na listagem — habilita o Desfazer
  // só para conciliações feitas nesta sessão; ver undo.binding). Após recarregar, fica chrome.
  const [recMap, setRecMap] = useState<ReadonlyMap<string, string>>(() => new Map())
  const recordReconciliation = useCallback((transactionId: string, reconciliationId: string) => {
    setRecMap((prev) => new Map(prev).set(transactionId, reconciliationId))
  }, [])
  const forgetReconciliation = useCallback((transactionId: string) => {
    setRecMap((prev) => {
      const next = new Map(prev)
      next.delete(transactionId)
      return next
    })
  }, [])

  // ── Lista de transações (server-state → estado da tela via view-model pura) ──
  const allTx: readonly StatementTransaction[] = txQuery.data?.ok === true ? txQuery.data.value : []
  const payables: readonly PaidPayable[] = payablesQuery.data?.ok === true ? payablesQuery.data.value : []
  const selectedTx =
    ui.selectedTransactionId === null ? null : (allTx.find((t) => t.id === ui.selectedTransactionId) ?? null)

  const pendentesCount = allTx.filter(isPending).length

  const reconcileBinding = useReconcile(recordReconciliation)
  const searchCreateBinding = useSearchCreate(selectedTx, payables, recordReconciliation)
  const manualEntryBinding = useManualEntry(selectedTx, recordReconciliation)
  const undoBinding = useUndo(forgetReconciliation)
  const closePeriodBinding = useClosePeriod(
    accountRef,
    importBinding.summary?.period ?? null,
    pendentesCount > 0,
  )

  const filterCounts: FilterCounts = {
    pendentes: pendentesCount,
    conciliadas: allTx.filter((t) => !isPending(t)).length,
    todas: allTx.length,
  }

  const extratoItems = filterExtrato(allTx, ui.extratoFilter)
  const extrato = {
    hasStatement: ui.statementId !== null,
    days: groupExtratoDays(extratoItems),
    totals: extratoTotals(extratoItems),
    count: extratoItems.length,
    counts: {
      todos: allTx.length,
      entradas: allTx.filter((tx) => tx.movement === 'Credit').length,
      saidas: allTx.filter((tx) => tx.movement === 'Debit').length,
      conciliados: allTx.filter((tx) => !isPending(tx)).length,
      pendentes: pendentesCount,
    },
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

  // ── Sugestões da transação selecionada (join com Pagos; rejeitadas filtradas) ──
  const payablesMap: ReadonlyMap<string, PaidPayable> = new Map(payables.map((p) => [p.id, p]))

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
    account,
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
    payables,
    extrato,
    import: importBinding,
    reconcile: reconcileBinding,
    searchCreate: searchCreateBinding,
    manualEntry: manualEntryBinding,
    undo: undoBinding,
    closePeriod: closePeriodBinding,
    reconciliationIdFor: (transactionId) => recMap.get(transactionId) ?? null,
    setTab: (tab) => {
      dispatch({ type: 'set-tab', tab })
    },
    toggleGuesses: () => {
      dispatch({ type: 'toggle-guesses' })
    },
    setListFilter: (filter) => {
      dispatch({ type: 'set-list-filter', filter })
    },
    setExtratoFilter: (filter) => {
      dispatch({ type: 'set-extrato-filter', filter })
    },
    selectTransaction: (id) => {
      dispatch({ type: 'select-transaction', id })
    },
    setAssocTab: (tab) => {
      dispatch({ type: 'set-assoc-tab', tab })
    },
  }
}
