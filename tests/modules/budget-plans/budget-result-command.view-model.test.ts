/**
 * Testes puros do mapeador FORM → PAYLOAD do "Calculando Gastos" (§1.7 + core-api#413). É a tradução entre o
 * que o usuário digita (string, vírgula decimal) e o que o core-api aceita (centavos inteiros / percentuais).
 * Erro aqui grava número errado SEM erro nenhum — daí a cobertura campo a campo. Sem DOM.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  configToPayload,
  caedToPayload,
  pessoalToPayload,
  logisticaToPayload,
  toExerciseMonths,
} from '#modules/budget-plans/client/planejamento/detalhe/orcamento/budget-result-command.view-model.ts'
import { emptyPessoalForm } from '#modules/budget-plans/client/planejamento/detalhe/orcamento/pessoal-calc.view-model.ts'
import { emptyLogisticaForm } from '#modules/budget-plans/client/planejamento/detalhe/orcamento/logistica-calc.view-model.ts'

describe('toExerciseMonths — índice da UI (0..11) → mês do exercício (1..12)', () => {
  // O erro de ±1 aqui é o mais perigoso do módulo: grava Janeiro em Fevereiro, e os DOIS são meses válidos —
  // nenhum erro, nenhum aviso, só o número no lugar errado.
  it('Janeiro é índice 0 e vira mês 1; Dezembro é 11 e vira 12', () => {
    assert.deepEqual([...toExerciseMonths([0, 11])], [1, 12])
  })

  it('preserva a ordem e a quantidade (um POST por mês)', () => {
    assert.deepEqual([...toExerciseMonths([2, 5, 8])], [3, 6, 9])
  })

  it('índice fora de 0..11 é DESCARTADO — não existe mês 13 nem mês 0', () => {
    assert.deepEqual([...toExerciseMonths([-1, 0, 12, 99])], [1])
  })

  it('nenhum mês selecionado → nada a gravar', () => {
    assert.equal(toExerciseMonths([]).length, 0)
  })
})

describe('configToPayload (form geral = modelo IPCA)', () => {
  it('total em BRL vira centavos; o IPCA vira número', () => {
    const p = configToPayload({ total: '1.234,56', ipca: '4,5' })
    assert.equal(p.kind, 'ipca')
    assert.deepEqual(p, { kind: 'ipca', baseValueInCents: 123_456, ipca: 4.5 })
  })

  it('IPCA NEGATIVO passa (deflação existe no histórico do IBGE)', () => {
    const p = configToPayload({ total: '100,00', ipca: '-2,5' })
    assert.equal(p.kind === 'ipca' && p.ipca, -2.5)
  })

  it('IPCA vazio → 0 (sem correção), não NaN', () => {
    const p = configToPayload({ total: '100,00', ipca: '' })
    assert.equal(p.kind === 'ipca' && p.ipca, 0)
  })
})

describe('caedToPayload', () => {
  it('matrículas é CONTAGEM inteira; custo unitário vira centavos', () => {
    const p = caedToPayload({ matriculas: '250', custoUnitario: '12,34', meses: [] })
    assert.deepEqual(p, { kind: 'caed', numberOfEnrollments: 250, baseValueInCents: 1234 })
  })

  it('matrícula quebrada/vazia não vira NaN nem fração (o core-api exige inteiro ≥ 0)', () => {
    assert.equal(caedToPayload({ matriculas: '', custoUnitario: '1', meses: [] }).kind, 'caed')
    const p = caedToPayload({ matriculas: '3,7', custoUnitario: '1', meses: [] })
    assert.equal(p.kind === 'caed' && Number.isInteger(p.numberOfEnrollments), true)
  })
})

describe('pessoalToPayload — os 14 campos da folha', () => {
  const form = {
    ...emptyPessoalForm(0, [0]),
    qtd: '7', // METADADO: não pode viajar (core-api#460)
    nivel: 'Sênior',
    vinculo: 'CLT',
    salario: '3.670,92',
    reajuste: '5',
    inssPatronal: '20',
    inss: '11',
    fgts: '8',
    pis: '1',
    valeTransporte: '200,00',
    alimentacao: '500,00',
    planoSaude: '300,00',
    seguroVida: '50,00',
    feriasEncargos: '100,00',
    abono: '10,00',
    decimoEncargos: '20,00',
    fgtsMultaAdicional: '30,00',
  }

  it('salário e benefícios viram centavos; percentuais ficam números', () => {
    const p = pessoalToPayload(form)
    assert.equal(p.kind, 'personal')
    if (p.kind !== 'personal') return
    assert.equal(p.salaryInCents, 367_092)
    assert.equal(p.salaryAdjustment, 5)
    assert.equal(p.inssEmployer, 20)
    assert.equal(p.transportationVouchersInCents, 20_000)
    assert.equal(p.foodVoucherInCents, 50_000)
  })

  // Vale-transporte e alimentação são dois campos DIFERENTES com nomes parecidos nos dois lados. Trocá-los
  // não muda o total (soma), então o cálculo continuaria "certo" — e o dado gravado, errado.
  it('vale-transporte e alimentação NÃO se cruzam', () => {
    const p = pessoalToPayload({ ...form, valeTransporte: '111,00', alimentacao: '222,00' })
    if (p.kind !== 'personal') return
    assert.equal(p.transportationVouchersInCents, 11_100)
    assert.equal(p.foodVoucherInCents, 22_200)
  })

  it('a Qtd NÃO viaja — é metadado (#460)', () => {
    const p = pessoalToPayload(form)
    assert.equal(Object.values(p).includes(7), false)
    assert.equal('qtd' in p, false)
  })

  it('nível/vínculo não viajam (o core-api não tem onde guardar — #464)', () => {
    const p = pessoalToPayload(form)
    assert.equal('nivel' in p, false)
    assert.equal('vinculo' in p, false)
  })

  it('form vazio → tudo 0, nunca NaN (NaN quebraria o Zod da borda com erro opaco)', () => {
    const p = pessoalToPayload(emptyPessoalForm(0, []))
    for (const v of Object.values(p)) {
      if (typeof v === 'number') assert.equal(Number.isFinite(v), true)
    }
  })
})

describe('logisticaToPayload — os 11 campos da viagem', () => {
  const form = {
    ...emptyLogisticaForm([0]),
    pessoas: '3',
    viagens: '2',
    passagem: '1.500,00',
    hospedagem: '200,00',
    diariasHospedagem: '4',
    alimentacao: '80,00',
    diariasAlimentacao: '5',
    transporte: '60,00',
    diariasTransporte: '6',
    carroCombustivel: '90,00',
    diariasCarro: '7',
  }

  it('valores viram centavos e as diárias ficam contagens', () => {
    const p = logisticaToPayload(form)
    assert.equal(p.kind, 'logistics')
    if (p.kind !== 'logistics') return
    assert.equal(p.numberOfPeople, 3)
    assert.equal(p.totalTrips, 2)
    assert.equal(p.airfareInCents, 150_000)
    assert.equal(p.accommodationInCents, 20_000)
    assert.equal(p.dailyAccommodation, 4)
  })

  // Cada despesa tem um par (valor, nº de diárias). Cruzar os pares mantém o total plausível e erra o dado.
  it('cada diária fica com a SUA despesa', () => {
    const p = logisticaToPayload(form)
    if (p.kind !== 'logistics') return
    assert.equal(p.dailyFood, 5)
    assert.equal(p.foodInCents, 8000)
    assert.equal(p.dailyTransport, 6)
    assert.equal(p.transportInCents, 6000)
    assert.equal(p.dailyCarAndFuel, 7)
    assert.equal(p.carAndFuelInCents, 9000)
  })
})
