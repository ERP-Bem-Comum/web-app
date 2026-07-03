/**
 * Testes do ViewModel puro do modal "Adicionar Orçamento" (§1.6): estado obrigatório + bloqueio de estado
 * já existente (comparado pelo rótulo da opção, case-insensitive).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  emptyAddBudgetForm,
  validateAddBudget,
} from '#modules/budget-plans/client/planejamento/detalhe/add-budget.view-model.ts'
import type { RegionOption } from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

const OPTIONS: readonly RegionOption[] = [
  { value: 'CE', label: 'Ceará' },
  { value: 'AC', label: 'Acre' },
]

describe('validateAddBudget', () => {
  it('form vazio → estado-required', () => {
    assert.equal(validateAddBudget(emptyAddBudgetForm(), OPTIONS, []), 'estado-required')
  })

  it('estado novo → sem erro', () => {
    assert.equal(validateAddBudget({ estado: 'CE' }, OPTIONS, ['Acre']), null)
  })

  it('estado já existente (pelo rótulo) → estado-duplicate', () => {
    assert.equal(validateAddBudget({ estado: 'AC' }, OPTIONS, ['Acre']), 'estado-duplicate')
  })

  it('comparação é case-insensitive', () => {
    assert.equal(validateAddBudget({ estado: 'CE' }, OPTIONS, ['ceará']), 'estado-duplicate')
  })
})
