/**
 * Testes do ViewModel puro do modal "Adicionar Orçamento" (#394): rede obrigatória, bloqueio de rede já
 * orçada (por REF/chave natural), valor obrigatório/parse de centavos.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  emptyAddBudgetForm,
  validateAddBudget,
  parseAddBudgetCents,
} from '#modules/budget-plans/client/planejamento/detalhe/add-budget.view-model.ts'

describe('validateAddBudget', () => {
  it('form vazio → estado-required', () => {
    assert.equal(validateAddBudget(emptyAddBudgetForm(), []), 'estado-required')
  })

  it('rede já orçada (por ref) → estado-duplicate', () => {
    assert.equal(validateAddBudget({ estado: 'CE', valor: '1000' }, ['CE']), 'estado-duplicate')
  })

  it('rede nova mas sem valor → valor-required', () => {
    assert.equal(validateAddBudget({ estado: 'CE', valor: '' }, ['AC']), 'valor-required')
  })

  it('rede nova + valor válido → sem erro', () => {
    assert.equal(validateAddBudget({ estado: 'CE', valor: '5.000,00' }, ['AC']), null)
  })
})

describe('parseAddBudgetCents', () => {
  it('reais com milhar/decimal → centavos; inválido/≤0 → null', () => {
    assert.equal(parseAddBudgetCents('5.000,00'), 500_000)
    assert.equal(parseAddBudgetCents('1234'), 123_400)
    assert.equal(parseAddBudgetCents('10,5'), 1050)
    assert.equal(parseAddBudgetCents(''), null)
    assert.equal(parseAddBudgetCents('0'), null)
    assert.equal(parseAddBudgetCents('abc'), null)
  })
})
