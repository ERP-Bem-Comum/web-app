/**
 * Testes do ViewModel puro do form de Logística (Tipo D): quebra por cartão (Passagens/Hospedagem/Despesas)
 * e o custo mensal = (pessoas×viagens) × [passagem + hospedagem·diárias + (alim/transp/carro)·diárias].
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  emptyLogisticaForm,
  computeLogistica,
} from '#modules/budget-plans/client/planejamento/detalhe/orcamento/logistica-calc.view-model.ts'

describe('computeLogistica', () => {
  it('form vazio → zero (mesmo com pessoas/viagens=1, valores em branco)', () => {
    const c = computeLogistica(emptyLogisticaForm())
    assert.equal(c.custoMensalCents, 0)
    assert.equal(c.passagensCents, 0)
  })

  it('quebra por cartão e total', () => {
    // 2 pessoas × 1 viagem = 2; passagem R$100 → 20000; hospedagem R$50 × 2 diárias → 20000.
    const c = computeLogistica({
      ...emptyLogisticaForm([0]),
      pessoas: '2',
      viagens: '1',
      passagem: '100,00',
      hospedagem: '50,00',
      diariasHospedagem: '2',
    })
    assert.equal(c.passagensCents, 20000)
    assert.equal(c.hospedagemCents, 20000)
    assert.equal(c.despesasCents, 0)
    assert.equal(c.custoMensalCents, 40000)
    assert.equal(c.custoAnualCents, 40000) // 1 mês aplicado
  })

  it('despesas somam alimentação/transporte/carro × diárias', () => {
    const c = computeLogistica({
      ...emptyLogisticaForm(),
      pessoas: '1',
      viagens: '1',
      alimentacao: '30,00',
      diariasAlimentacao: '2',
      transporte: '10,00',
      diariasTransporte: '1',
    })
    // 1×(2×3000) + 1×(1×1000) = 6000 + 1000 = 7000
    assert.equal(c.despesasCents, 7000)
    assert.equal(c.custoMensalCents, 7000)
  })
})
