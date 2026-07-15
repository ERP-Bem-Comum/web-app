/**
 * Testes do ViewModel puro do modal "Adicionar Orçamento" (#394): rede obrigatória e bloqueio de rede já
 * orçada (por REF/chave natural).
 *
 * ── Sem valor (core-api#458) ── Este arquivo testava `valor-required` e `parseAddBudgetCents`. Os dois
 * saíram: o campo "Valor do orçamento" era invenção nossa — o HANDBOOK §1.6 pede só "dropdown Estado +
 * Adicionar" e o DTO do legado é `{ budgetPlanId, partnerStateId?, partnerMunicipalityId? }`, sem valor.
 * O total da Rede é DERIVADO dos lançamentos (decisão da P.O., 2026-07-15).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  emptyAddBudgetForm,
  validateAddBudget,
} from '#modules/budget-plans/client/planejamento/detalhe/add-budget.view-model.ts'

describe('validateAddBudget', () => {
  it('form vazio → estado-required', () => {
    assert.equal(validateAddBudget(emptyAddBudgetForm(), []), 'estado-required')
  })

  it('rede já orçada (por ref) → estado-duplicate', () => {
    assert.equal(validateAddBudget({ estado: 'CE' }, ['CE']), 'estado-duplicate')
  })

  it('rede nova → sem erro (a rede é o ÚNICO obrigatório, como no legado)', () => {
    assert.equal(validateAddBudget({ estado: 'CE' }, ['AC']), null)
  })

  it('o form nasce só com a rede — não há campo de valor', () => {
    assert.deepEqual(emptyAddBudgetForm(), { estado: '' })
  })

  it('duplicidade é por REF exata — "CE" não colide com "CEA"', () => {
    assert.equal(validateAddBudget({ estado: 'CE' }, ['CEA', 'AC']), null)
  })
})
