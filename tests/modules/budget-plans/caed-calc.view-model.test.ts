/**
 * Testes do ViewModel puro do form CAED (Tipo C): matrículas × custo unitário; custo anual × nº de meses.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  parseCount,
  emptyCaedForm,
  computeCaed,
} from '#modules/budget-plans/client/planejamento/detalhe/orcamento/caed-calc.view-model.ts'

describe('parseCount', () => {
  it('inteiro não-negativo, truncando', () => {
    assert.equal(parseCount('10'), 10)
    assert.equal(parseCount('3,9'), 3)
    assert.equal(parseCount(''), 0)
    assert.equal(parseCount('-5'), 0)
  })
})

describe('computeCaed', () => {
  it('form vazio → zero', () => {
    assert.deepEqual(computeCaed(emptyCaedForm()), { custoMensalCents: 0, custoAnualCents: 0 })
  })
  it('matrículas × custo unitário (centavos)', () => {
    const c = computeCaed({ matriculas: '10', custoUnitario: '5,00', meses: [] })
    assert.equal(c.custoMensalCents, 5000) // 10 × R$5,00
    assert.equal(c.custoAnualCents, 0) // sem meses
  })
  it('custo anual = mensal × nº de meses', () => {
    const c = computeCaed({ matriculas: '10', custoUnitario: '5,00', meses: [0, 1, 2] })
    assert.equal(c.custoAnualCents, 15000)
  })
})
