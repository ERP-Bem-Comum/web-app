/**
 * contas-a-pagar-saved-views.view-model (node:test) — núcleo PURO das visões salvas: captura do snapshot,
 * round-trip serialize/parse e a TOLERÂNCIA do parse (JSON corrompido / shape inválido → [], nunca throw).
 * Imports RELATIVOS (node:test resolve os subpath `#…` via package.json `imports`).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  captureView,
  serializeViews,
  parseViews,
  type SavedView,
} from '../../../../../src/modules/financial/client/contas-a-pagar-list/contas-a-pagar-saved-views.view-model.ts'
import type { AdvancedFilters } from '../../../../../src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts'

describe('captureView', () => {
  it('faz o snapshot de { name, status, dims, filters } SEM id (o binding carimba o id)', () => {
    const filters: AdvancedFilters = { vencimento: { from: '2026-07-01', to: '2026-07-31' }, tipo: 'RPA' }
    const snap = captureView('  Julho a vencer  ', 'Aprovado', ['vencimento', 'tipo'], filters)
    assert.equal(snap.name, 'Julho a vencer') // trim
    assert.equal(snap.status, 'Aprovado')
    assert.deepEqual(snap.dims, ['vencimento', 'tipo'])
    assert.deepEqual(snap.filters, filters)
    assert.equal('id' in snap, false)
  })

  it('copia o array de dims (imutabilidade — mutar a origem não afeta o snapshot)', () => {
    const dims = ['fornecedor'] as const
    const snap = captureView('X', null, dims, {})
    assert.deepEqual(snap.dims, ['fornecedor'])
    assert.notStrictEqual(snap.dims, dims)
  })
})

describe('serialize/parse round-trip', () => {
  it('preserva as visões válidas na ida-e-volta', () => {
    const views: readonly SavedView[] = [
      { id: 'a', name: 'Todos abertos', status: 'Aberto', dims: [], filters: {} },
      {
        id: 'b',
        name: 'RPA do mês',
        status: null,
        dims: ['vencimento', 'tipo', 'fornecedor'],
        filters: {
          vencimento: { from: '2026-07-01', to: '2026-07-31' },
          tipo: 'RPA',
          fornecedor: 's-123',
        },
      },
    ]
    const round = parseViews(serializeViews(views))
    assert.deepEqual(round, views)
  })

  it('aceita status null e imposto (retenção) como tipo', () => {
    const views: readonly SavedView[] = [
      { id: 'c', name: 'ISS', status: null, dims: ['tipo'], filters: { tipo: 'ISS' } },
    ]
    assert.deepEqual(parseViews(serializeViews(views)), views)
  })
})

describe('parseViews — tolerante (§II: nunca lança)', () => {
  it('null → []', () => {
    assert.deepEqual(parseViews(null), [])
  })
  it('string vazia → []', () => {
    assert.deepEqual(parseViews(''), [])
  })
  it('JSON corrompido → []', () => {
    assert.deepEqual(parseViews('{lixo não-json'), [])
  })
  it('JSON válido mas não-array → []', () => {
    assert.deepEqual(parseViews('{"a":1}'), [])
    assert.deepEqual(parseViews('42'), [])
  })
  it('descarta entradas inválidas e mantém as válidas', () => {
    const raw = JSON.stringify([
      { id: '', name: 'sem id', status: null, dims: [], filters: {} }, // id vazio → fora
      { id: 'ok', name: 'boa', status: 'Aberto', dims: ['vencimento'], filters: {} }, // ok
      { id: 'x', name: 'status inválido', status: 'Inexistente', dims: [], filters: {} }, // status → fora
      { id: 'y', name: 42, status: null, dims: [], filters: {} }, // nome não-string → fora
      'não-objeto',
      null,
    ])
    const out = parseViews(raw)
    assert.equal(out.length, 1)
    assert.equal(out[0]?.id, 'ok')
  })
  it('sanitiza dims e campos de filtro desconhecidos/malformados', () => {
    const raw = JSON.stringify([
      {
        id: 'z',
        name: 'suja',
        status: 'Pago',
        dims: ['vencimento', 'bogus', 123], // só 'vencimento' sobrevive
        filters: {
          vencimento: { from: '2026-07-01', to: 5 }, // to inválido → ignorado
          tipo: 'NAO_EXISTE', // tipo inválido → descartado
          fornecedor: '', // vazio → descartado
          valorMin: 100, // predicado futuro (#164) ainda não no shape → ignorado hoje
        },
      },
    ])
    const out = parseViews(raw)
    assert.equal(out.length, 1)
    assert.deepEqual(out[0]?.dims, ['vencimento'])
    assert.deepEqual(out[0]?.filters, { vencimento: { from: '2026-07-01' } })
  })
})
