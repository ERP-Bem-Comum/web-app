/**
 * ViewModel do seletor Realizado × Previsto (node:test, puro) — specs/096 P3. Mapeamento valor↔seleção e
 * a montagem das opções ("Todos somados" como chave i18n + cada plano com rótulo pronto).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  ALL_OPTION_VALUE,
  toSelectorOptions,
  valueToSelection,
  selectionToValue,
} from '../../../../../src/modules/financial/client/dashboard/dashboard-realized.view-model.ts'

describe('toSelectorOptions', () => {
  it('prepende "Todos somados" (chave i18n) + planos com rótulo pronto', () => {
    const out = toSelectorOptions([
      { id: 'p1', label: 'ABC · v1.0' },
      { id: 'p2', label: 'XYZ · v1.0' },
    ])
    assert.equal(out.length, 3)
    assert.deepEqual(out[0], { value: ALL_OPTION_VALUE, label: 'dashboard.realized.all', translate: true })
    assert.deepEqual(out[1], { value: 'p1', label: 'ABC · v1.0', translate: false })
  })
  it('sem planos → só o "Todos"', () => {
    assert.equal(toSelectorOptions([]).length, 1)
  })
})

describe('valor ↔ seleção', () => {
  it('all ↔ "all"', () => {
    assert.deepEqual(valueToSelection('all'), { kind: 'all' })
    assert.equal(selectionToValue({ kind: 'all' }), 'all')
  })
  it('plano ↔ id', () => {
    assert.deepEqual(valueToSelection('p9'), { kind: 'plan', budgetPlanId: 'p9' })
    assert.equal(selectionToValue({ kind: 'plan', budgetPlanId: 'p9' }), 'p9')
  })
})
