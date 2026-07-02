/**
 * Testes das derivações puras: regra de edição por status, soma de meses e formatação BRL.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { deriveEditable, sumMonths, formatCentsBRL } from '#modules/budget-plans/client/domain/calc/derive.ts'

describe('deriveEditable', () => {
  it('Rascunho e Em Calibração são editáveis; Aprovado não', () => {
    assert.equal(deriveEditable('RASCUNHO'), true)
    assert.equal(deriveEditable('EM_CALIBRACAO'), true)
    assert.equal(deriveEditable('APROVADO'), false)
  })
})

describe('sumMonths', () => {
  it('soma os valores mensais em centavos', () => {
    assert.equal(sumMonths([0, 1_621_936, 1_621_936, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 3_243_872)
  })
  it('lista vazia = 0', () => {
    assert.equal(sumMonths([]), 0)
  })
})

describe('formatCentsBRL', () => {
  it('centavos inteiros → string BRL', () => {
    assert.equal(formatCentsBRL(3_243_872), 'R$ 32.438,72')
    assert.equal(formatCentsBRL(0), 'R$ 0,00')
  })
})
