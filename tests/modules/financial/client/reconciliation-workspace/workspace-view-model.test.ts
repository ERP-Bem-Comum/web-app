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
} from '../../../../../src/modules/financial/client/reconciliation-workspace/reconciliation-workspace.view-model.ts'

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
