/**
 * Testes do ViewModel puro do FORMULÁRIO de custo de Pessoal (US2.4c): parsing BR, salário reajustado,
 * encargos %, somas de benefícios/provisões, custo mensal × qtd e custo anual × nº de meses.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  parseCentsBR,
  parsePct,
  emptyPessoalForm,
  computePessoal,
  type PessoalForm,
} from '#modules/budget-plans/client/planejamento/detalhe/orcamento/pessoal-calc.view-model.ts'

const form = (over: Partial<PessoalForm> = {}): PessoalForm => ({ ...emptyPessoalForm(), ...over })

describe('parseCentsBR', () => {
  it('converte "34.336,73" em centavos', () => {
    assert.equal(parseCentsBR('34.336,73'), 3_433_673)
  })
  it('formato BR: ponto é milhar (decimal só na vírgula)', () => {
    assert.equal(parseCentsBR('1.000'), 100_000) // R$ 1.000,00
    assert.equal(parseCentsBR('1.000,50'), 100_050) // R$ 1.000,50
  })
  it('vazio/ inválido → 0', () => {
    assert.equal(parseCentsBR(''), 0)
    assert.equal(parseCentsBR('abc'), 0)
  })
  it('nunca negativo', () => {
    assert.equal(parseCentsBR('-10'), 0)
  })
})

describe('parsePct', () => {
  it('aceita vírgula e ponto', () => {
    assert.equal(parsePct('12,5'), 12.5)
    assert.equal(parsePct('8'), 8)
  })
  it('inválido → 0', () => {
    assert.equal(parsePct('x'), 0)
  })
})

describe('computePessoal', () => {
  it('form vazio → tudo zero (qtd mínima 1, sem meses → anual 0)', () => {
    const c = computePessoal(emptyPessoalForm())
    assert.deepEqual(c, {
      salarioTotalCents: 0,
      totalEncargosCents: 0,
      totalBeneficiosCents: 0,
      totalProvisoesCents: 0,
      custoMensalCents: 0,
      custoAnualCents: 0,
    })
  })

  it('salário total aplica reajuste %', () => {
    const c = computePessoal(form({ salario: '1000', reajuste: '10' }))
    assert.equal(c.salarioTotalCents, 110_000) // R$ 1.100,00
  })

  it('encargos = salário total × soma dos %', () => {
    const c = computePessoal(form({ salario: '1000', inssPatronal: '20', fgts: '8' }))
    assert.equal(c.salarioTotalCents, 100_000)
    assert.equal(c.totalEncargosCents, 28_000) // 28% de 1000,00
  })

  it('benefícios e provisões somam os campos', () => {
    const c = computePessoal(
      form({ valeTransporte: '100', alimentacao: '200', feriasEncargos: '50', decimoEncargos: '50' }),
    )
    assert.equal(c.totalBeneficiosCents, 30_000)
    assert.equal(c.totalProvisoesCents, 10_000)
  })

  it('custo mensal multiplica pela quantidade', () => {
    const c = computePessoal(form({ salario: '1000', qtd: '3' }))
    assert.equal(c.custoMensalCents, 300_000)
  })

  it('custo anual = mensal × nº de meses aplicados', () => {
    const c = computePessoal(form({ salario: '1000', meses: [0, 1, 2] }))
    assert.equal(c.custoMensalCents, 100_000)
    assert.equal(c.custoAnualCents, 300_000)
  })

  it('qtd < 1 é tratada como 1', () => {
    const c = computePessoal(form({ salario: '1000', qtd: '0' }))
    assert.equal(c.custoMensalCents, 100_000)
  })
})
