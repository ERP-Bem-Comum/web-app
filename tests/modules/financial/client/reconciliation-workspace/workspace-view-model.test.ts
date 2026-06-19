/**
 * Workspace view-model (puro, node:test) — reducer de UI-state + derivações de progresso. Sem React.
 * Import relativo (os #alias resolvem só no bundler).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  initialWorkspaceUiState,
  workspaceReducer,
  progressLabel,
  progressPercent,
  entryTypeIcon,
  isPending,
  transactionTag,
  filterTransactions,
  groupTransactionsByDay,
  countReconciled,
} from '../../../../../src/modules/financial/client/reconciliation-workspace/reconciliation-workspace.view-model.ts'
import type {
  Movement,
  ReconciliationStatus,
  StatementTransaction,
} from '../../../../../src/modules/financial/client/data/model/reconciliation.model.ts'

const tx = (
  over: Partial<StatementTransaction> & Pick<StatementTransaction, 'id'>,
): StatementTransaction => ({
  fitid: 'F',
  date: '2026-06-01',
  movement: 'Debit' as Movement,
  entryType: 'TED',
  payeeName: 'X',
  memo: '',
  valueCents: '100',
  balanceAfterCents: '0',
  reconciliationStatus: 'Pending' as ReconciliationStatus,
  ...over,
})

describe('workspaceReducer', () => {
  it('estado inicial: aba conciliação, palpites on, filtro pendentes', () => {
    assert.equal(initialWorkspaceUiState.activeTab, 'conciliacao')
    assert.equal(initialWorkspaceUiState.showGuesses, true)
    assert.equal(initialWorkspaceUiState.listFilter, 'pendentes')
    assert.equal(initialWorkspaceUiState.selectedTransactionId, null)
    assert.equal(initialWorkspaceUiState.assocTab, 'sugestao')
  })

  it('set-tab troca a aba ativa', () => {
    const next = workspaceReducer(initialWorkspaceUiState, { type: 'set-tab', tab: 'extrato' })
    assert.equal(next.activeTab, 'extrato')
  })

  it('toggle-guesses inverte o toggle', () => {
    const off = workspaceReducer(initialWorkspaceUiState, { type: 'toggle-guesses' })
    assert.equal(off.showGuesses, false)
    const on = workspaceReducer(off, { type: 'toggle-guesses' })
    assert.equal(on.showGuesses, true)
  })

  it('set-list-filter muda o filtro da lista', () => {
    const next = workspaceReducer(initialWorkspaceUiState, { type: 'set-list-filter', filter: 'todas' })
    assert.equal(next.listFilter, 'todas')
  })

  it('select-transaction guarda o id e volta a aba de associação para Sugestão', () => {
    const onNova = workspaceReducer(initialWorkspaceUiState, { type: 'set-assoc-tab', tab: 'nova' })
    assert.equal(onNova.assocTab, 'nova')
    const selected = workspaceReducer(onNova, { type: 'select-transaction', id: 't1' })
    assert.equal(selected.selectedTransactionId, 't1')
    assert.equal(selected.assocTab, 'sugestao')
  })

  it('set-assoc-tab troca a aba do painel de associação', () => {
    const next = workspaceReducer(initialWorkspaceUiState, { type: 'set-assoc-tab', tab: 'multi' })
    assert.equal(next.assocTab, 'multi')
  })

  it('não muta o estado anterior (imutável)', () => {
    const next = workspaceReducer(initialWorkspaceUiState, { type: 'set-tab', tab: 'extrato' })
    assert.notEqual(next, initialWorkspaceUiState)
    assert.equal(initialWorkspaceUiState.activeTab, 'conciliacao')
  })
})

describe('progresso', () => {
  it('progressLabel = "X/N"', () => {
    assert.equal(progressLabel(46, 128), '46/128')
    assert.equal(progressLabel(0, 0), '0/0')
  })

  it('progressPercent arredonda e limita a 0..100; total 0 → 0', () => {
    assert.equal(progressPercent(46, 128), 36)
    assert.equal(progressPercent(0, 0), 0)
    assert.equal(progressPercent(1, 3), 33)
    assert.equal(progressPercent(3, 3), 100)
  })
})

describe('entryTypeIcon (heurística + fallback por movimento)', () => {
  it('tarifa/juros → fee', () => {
    assert.equal(entryTypeIcon('TARIFA', 'Debit'), 'fee')
    assert.equal(entryTypeIcon('JUROS', 'Credit'), 'fee')
    assert.equal(entryTypeIcon('FEE', 'Debit'), 'fee')
  })
  it('transferência → transfer', () => {
    assert.equal(entryTypeIcon('XFER', 'Debit'), 'transfer')
    assert.equal(entryTypeIcon('TED', 'Credit'), 'transfer')
    assert.equal(entryTypeIcon('DOC', 'Debit'), 'transfer')
  })
  it('aplicação/resgate → investment', () => {
    assert.equal(entryTypeIcon('APLICACAO', 'Debit'), 'investment')
    assert.equal(entryTypeIcon('RESGATE', 'Credit'), 'investment')
  })
  it('desconhecido cai no movimento (in/out)', () => {
    assert.equal(entryTypeIcon('ZZZ', 'Credit'), 'in')
    assert.equal(entryTypeIcon('OTHER', 'Debit'), 'out')
  })
})

describe('derivações da lista', () => {
  const a = tx({ id: 'a', date: '2026-06-01', reconciliationStatus: 'Pending' })
  const b = tx({ id: 'b', date: '2026-06-01', reconciliationStatus: 'Reconciled' })
  const c = tx({ id: 'c', date: '2026-06-02', reconciliationStatus: 'ManualEntry' })
  const d = tx({ id: 'd', date: '2026-06-02', reconciliationStatus: 'Pending' })
  const txs: readonly StatementTransaction[] = [a, b, c, d]

  it('isPending / transactionTag', () => {
    assert.equal(isPending(a), true)
    assert.equal(transactionTag(a), 'pending')
    assert.equal(transactionTag(b), 'reconciled')
    assert.equal(transactionTag(c), 'reconciled')
  })

  it('filterTransactions separa pendentes/conciliadas/todas', () => {
    assert.deepEqual(
      filterTransactions(txs, 'pendentes').map((t) => t.id),
      ['a', 'd'],
    )
    assert.deepEqual(
      filterTransactions(txs, 'conciliadas').map((t) => t.id),
      ['b', 'c'],
    )
    assert.equal(filterTransactions(txs, 'todas').length, 4)
  })

  it('groupTransactionsByDay agrupa por dia preservando a ordem', () => {
    const groups = groupTransactionsByDay(txs)
    assert.equal(groups.length, 2)
    assert.equal(groups[0]?.date, '2026-06-01')
    assert.deepEqual(
      groups[0]?.items.map((t) => t.id),
      ['a', 'b'],
    )
    assert.deepEqual(
      groups[1]?.items.map((t) => t.id),
      ['c', 'd'],
    )
  })

  it('countReconciled conta as não-pendentes', () => {
    assert.equal(countReconciled(txs), 2)
  })
})
