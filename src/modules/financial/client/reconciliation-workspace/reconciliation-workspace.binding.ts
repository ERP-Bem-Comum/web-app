/**
 * Binding do workspace de Conciliação — ADAPTER React (UI-state + queries + import + conciliação). Owns o
 * `useReducer` do UI-state, o seletor de conta (placeholder #168) e as queries (transações/títulos Pago/
 * sugestões). Deriva, via a view-model PURA, a lista agrupada por dia, o progresso e a "visão de match" da
 * transação selecionada. A page e os componentes são burros (só consomem este hook). US1 (conciliar por
 * sugestão) + US2 (importar) ligados; US3–US8 entram nas próximas fatias.
 */
import { useCallback, useEffect, useReducer, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  countReconciled,
  deriveConferencia,
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
  type Conferencia,
  type DayGroup,
  type ExtratoDayGroup,
  type ExtratoFilter,
  type ExtratoTotals,
  type ListFilter,
  type WorkspaceTab,
  type WorkspaceUiState,
} from './reconciliation-workspace.view-model.ts'
import { useAccountSelector } from './account-selector.binding.ts'
import { useChangeAccount, type ChangeAccountBinding } from './change-account.binding.ts'
import { useMatchDetails, type MatchDetailsBinding } from './match-details.binding.ts'
import { useHeaderMenus, resolvePeriodRange, type HeaderMenusBinding } from './header-menus.binding.ts'
import { useImport, type ImportBinding } from './import.binding.ts'
import { useReconcile, type ReconcileBinding } from './reconcile.binding.ts'
import { useSearchCreate, type SearchCreateBinding } from './search-create.binding.ts'
import { useManualEntry, type ManualEntryBinding } from './manual-entry.binding.ts'
import { useUndo, type UndoBinding } from './undo.binding.ts'
import { useClosePeriod, type ClosePeriodBinding } from './close-period.binding.ts'
import { useReopenPeriod, type ReopenPeriodBinding } from './reopen-period.binding.ts'
import { useExportConciliacao, type ExportBinding } from './export-conciliacao.binding.ts'
import {
  accountStatementPeriodQueryOptions,
  paidPayablesQueryOptions,
  statementSuggestionsQueryOptions,
  suggestionsQueryOptions,
  transactionReconciliationQueryOptions,
} from './reconciliation-workspace.query.ts'
import { reconciliationErrorTag } from '#modules/financial/client/data/helpers/reconciliation-error-tag.ts'
import type {
  AccountStatementPeriod as AccountStatementPeriodModel,
  CriterionResult,
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

// #174: palpite de topo de uma linha (banda + score), p/ o grid pintar sem N requisições de detalhe.
export type RowGuess = Readonly<{ band: SuggestionBand; score: number }>

export type MatchView = Readonly<{
  payableId: string
  score: number
  band: SuggestionBand
  criteria: SuggestionCriteria
  criteriaBreakdown: readonly CriterionResult[] // #140; vazio → pane cai nos chips booleanos
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
  /** #174: palpite de topo por transação (banda + score). Vazio quando "Exibir palpites" está off. */
  guesses: ReadonlyMap<string, RowGuess>
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
  // #205: saldo do PERÍODO selecionado (abertura acumulada até `from` → fechamento + entradas/saídas).
  // `data` null enquanto carrega ou se o período não resolve (ex.: personalizado incompleto).
  periodBalance: Readonly<{ loading: boolean; data: AccountStatementPeriodModel | null }>
  // #205: conferência da conciliação (apoio discreto p/ fechar o período); null sem dados do período.
  conferencia: Conferencia | null
  changeAccount: ChangeAccountBinding
  matchDetails: MatchDetailsBinding
  headerMenus: HeaderMenusBinding
  import: ImportBinding
  reconcile: ReconcileBinding
  searchCreate: SearchCreateBinding
  manualEntry: ManualEntryBinding
  undo: UndoBinding
  closePeriod: ClosePeriodBinding
  reopenPeriod: ReopenPeriodBinding
  exportConciliacao: ExportBinding
  /** id da conciliação da transação: mapa de sessão (conciliação feita agora) OU lookup #175. */
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
  criteriaBreakdown: s.criteriaBreakdown,
  payable: payables.get(s.payableId) ?? null,
})

// Persistência do extrato por conta: o `statementId` do extrato importado é efêmero no reducer, mas o
// statement em si vive no backend. Guardamos o id em localStorage (por conta) para restaurar ao recarregar
// — sem isso, reload/rebuild "apagava" o extrato. Não há degradação: o caminho de carga (Ref/saldo) é o mesmo.
const lastStatementKey = (ref: string): string => `recon.lastStatement.${ref}`
// Período do último extrato importado por conta → a aba Extrato reabre nesse intervalo após reload/rebuild.
const lastPeriodKey = (ref: string): string => `recon.lastPeriod.${ref}`
/** Lê o período persistido ("YYYY-MM-DD|YYYY-MM-DD") → {start,end}; null se ausente/malformado. */
const readPersistedPeriod = (raw: string | null): Readonly<{ start: string; end: string }> | null => {
  if (raw === null) return null
  const [start, end] = raw.split('|')
  return start !== undefined && start !== '' && end !== undefined && end !== '' ? { start, end } : null
}

export function useReconciliationWorkspace(routeAccountRef: string): WorkspaceBinding {
  const [ui, dispatch] = useReducer(workspaceReducer, initialWorkspaceUiState)
  const { accountRef, identityAvailable, account } = useAccountSelector(routeAccountRef)
  const changeAccountBinding = useChangeAccount(accountRef)
  const headerMenusBinding = useHeaderMenus()

  // #205: extrato por período — resolve o preset/intervalo do header em from/to e busca o saldo do período.
  // `now` estável (sessão) p/ não recalcular o intervalo a cada render.
  const [periodNow] = useState(() => new Date())
  const periodRange = resolvePeriodRange(
    headerMenusBinding.period,
    headerMenusBinding.customStart,
    headerMenusBinding.customEnd,
    periodNow,
  )
  const periodQuery = useQuery(accountStatementPeriodQueryOptions(accountRef, periodRange))
  const periodBalance = {
    loading: periodQuery.isFetching,
    data: periodQuery.data?.ok === true ? periodQuery.data.value : null,
  }

  // Mapa de sessão transação→conciliação (fast-path: conciliações feitas agora têm o id em memória). O
  // lookup #175 cobre o pós-reload; o `reconciliationId` prefere a sessão e cai no lookup.
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
  const sessionIdFor = (transactionId: string): string | null => recMap.get(transactionId) ?? null

  const matchDetailsBinding = useMatchDetails(sessionIdFor)

  const payablesQuery = useQuery(paidPayablesQueryOptions())
  const suggestionsQuery = useQuery(suggestionsQueryOptions(ui.selectedTransactionId))
  // #174: palpites em lote do extrato — busca só com "Exibir palpites" ligado (evita custo N+1 do backend).
  const statementSuggestionsQuery = useQuery(
    statementSuggestionsQueryOptions(ui.showGuesses ? ui.statementId : null),
  )

  const importBinding = useImport(accountRef, account, (statementId, period) => {
    dispatch({ type: 'set-statement', statementId })
    // Pula a aba Extrato para o período do arquivo importado → as movimentações aparecem na hora, sem o
    // usuário ter que adivinhar/selecionar o mês.
    headerMenusBinding.applyImportedPeriod(period.start, period.end)
    // Persiste extrato + período desta conta → sobrevivem a reload/rebuild (o backend mantém o statement).
    try {
      window.localStorage.setItem(lastStatementKey(accountRef), statementId)
      window.localStorage.setItem(lastPeriodKey(accountRef), `${period.start}|${period.end}`)
    } catch {
      // localStorage indisponível (SSR/modo privado) → já setado em memória; só não persiste.
      void statementId
    }
  })

  // Restaura o extrato + período persistidos ao montar/trocar de conta (efêmeros no reducer; o real fica no
  // localStorage). Só restaura se ainda não há extrato em tela. Cobre o "apaga no reload" (extrato E período).
  useEffect(() => {
    if (accountRef === '' || ui.statementId !== null) return
    try {
      const saved = window.localStorage.getItem(lastStatementKey(accountRef))
      if (saved !== null && saved !== '') dispatch({ type: 'set-statement', statementId: saved })
      const savedPeriod = readPersistedPeriod(window.localStorage.getItem(lastPeriodKey(accountRef)))
      if (savedPeriod !== null) headerMenusBinding.applyImportedPeriod(savedPeriod.start, savedPeriod.end)
    } catch {
      // localStorage indisponível → ignora (extrato/período seguem efêmeros).
      void accountRef
    }
  }, [accountRef, ui.statementId, headerMenusBinding.applyImportedPeriod])

  // ── Lista de transações: a Conciliação e o Extrato leem a MESMA fonte (movimentos da conta no período,
  //    #205) → coerência total entre as abas. Cada linha já traz o `reconciliationStatus` real (Pendente/
  //    Conciliado) e o `id` da transação (sugestões/conciliação operam por id). Sem extrato no período →
  //    lista vazia → a aba cai nos títulos pendentes (gatilho `txList.tag === 'empty'`). ──
  const allTx: readonly StatementTransaction[] = periodBalance.data?.movements ?? []
  const payables: readonly PaidPayable[] = payablesQuery.data?.ok === true ? payablesQuery.data.value : []
  const selectedTx =
    ui.selectedTransactionId === null ? null : (allTx.find((t) => t.id === ui.selectedTransactionId) ?? null)

  // Lookup #175 da transação selecionada (quando conciliada) → habilita o Desfazer do banner pós-reload.
  const selectedReconLookupTxId = selectedTx !== null && !isPending(selectedTx) ? selectedTx.id : null
  const selectedReconQuery = useQuery(transactionReconciliationQueryOptions(selectedReconLookupTxId))
  const selectedReconId =
    selectedReconQuery.data?.ok === true ? (selectedReconQuery.data.value?.reconciliationId ?? null) : null

  const pendentesCount = allTx.filter(isPending).length

  // Aba Conciliação: o motor de sugestão já aparece para a transação do TOPO da lista (sem exigir clique).
  // Auto-seleciona a 1ª transação do filtro atual enquanto nada estiver selecionado; depois respeita a
  // escolha do usuário. Cobre o load inicial (aba padrão) e a volta do Extrato sem seleção.
  const topTransactionId = filterTransactions(allTx, ui.listFilter)[0]?.id ?? null
  useEffect(() => {
    if (ui.activeTab === 'conciliacao' && ui.selectedTransactionId === null && topTransactionId !== null) {
      dispatch({ type: 'select-transaction', id: topTransactionId })
    }
  }, [ui.activeTab, ui.selectedTransactionId, topTransactionId])

  const reconcileBinding = useReconcile(recordReconciliation)
  const searchCreateBinding = useSearchCreate(selectedTx, payables, recordReconciliation)
  const manualEntryBinding = useManualEntry(selectedTx, recordReconciliation)
  // No sucesso do Desfazer: esquece o id de sessão E fecha o modal de detalhes. Em falha (ex.: período
  // fechado), o modal permanece aberto exibindo o erro (a confirmação fica na própria view).
  const undoBinding = useUndo((transactionId) => {
    forgetReconciliation(transactionId)
    matchDetailsBinding.close()
  })
  const closePeriodBinding = useClosePeriod(
    accountRef,
    importBinding.summary?.period ?? null,
    pendentesCount > 0,
  )
  const exportBinding = useExportConciliacao(
    accountRef === '' ? null : accountRef,
    headerMenusBinding.closeAll,
  )
  // #203: reabrir período (Closed → Open). Fecha o dropdown de ações ao concluir.
  const reopenPeriodBinding = useReopenPeriod(
    accountRef === '' ? null : accountRef,
    headerMenusBinding.closeAll,
  )

  const filterCounts: FilterCounts = {
    pendentes: pendentesCount,
    conciliadas: allTx.filter((t) => !isPending(t)).length,
    todas: allTx.length,
  }

  // #205: a aba Extrato é dirigida pelo PERÍODO (movimentos da conta), não pelo extrato importado. Saldo
  //   por linha (runningBalance), contadores e a "conferência" (apoio p/ fechar) saem todos do #205.
  const extratoMovements = periodBalance.data?.movements ?? []
  const extratoItems = filterExtrato(extratoMovements, ui.extratoFilter)
  const conferencia = deriveConferencia(periodBalance.data)
  const c = periodBalance.data?.counters ?? null
  const extrato = {
    hasStatement: periodRange !== null, // "pronto" = há período resolvido (idle só sem período)
    days: groupExtratoDays(extratoItems),
    totals: extratoTotals(extratoItems),
    count: extratoItems.length,
    counts: {
      todos: c?.all ?? 0,
      entradas: c?.in ?? 0,
      saidas: c?.out ?? 0,
      conciliados: c?.reconciled ?? 0,
      pendentes: c?.pending ?? 0,
    },
  }

  // Estado da lista da Conciliação — dirigido pelo PERÍODO (#205), como o Extrato. `empty` = não há
  // movimento importado no período → a view mostra os títulos pendentes (fallback honesto).
  const txList: TxListState = (() => {
    if (periodRange === null) return { tag: 'idle' }
    if (periodQuery.isLoading) return { tag: 'loading' }
    if (periodQuery.data?.ok === false)
      return { tag: 'error', errorTag: reconciliationErrorTag(periodQuery.data.error) }
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

  // #174: mapa transação→palpite de topo (só bandas reais; null = não-Pending/sem candidato é ignorado).
  // flatMap + checks de null narrowam band/score sem type-assertion (`as`).
  const guesses: ReadonlyMap<string, RowGuess> = new Map(
    (statementSuggestionsQuery.data?.ok === true ? statementSuggestionsQuery.data.value : []).flatMap((g) =>
      g.topBand !== null && g.topScore !== null
        ? [[g.transactionId, { band: g.topBand, score: g.topScore }] as const]
        : [],
    ),
  )

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
    guesses,
    selectedTx,
    suggestions,
    payables,
    extrato,
    periodBalance,
    conferencia,
    changeAccount: changeAccountBinding,
    matchDetails: matchDetailsBinding,
    headerMenus: headerMenusBinding,
    import: importBinding,
    reconcile: reconcileBinding,
    searchCreate: searchCreateBinding,
    manualEntry: manualEntryBinding,
    undo: undoBinding,
    closePeriod: closePeriodBinding,
    reopenPeriod: reopenPeriodBinding,
    exportConciliacao: exportBinding,
    reconciliationIdFor: (transactionId) =>
      recMap.get(transactionId) ??
      (transactionId === selectedReconLookupTxId ? selectedReconId : null) ??
      null,
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
