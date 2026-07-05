/**
 * ViewModel do relatório "Fornecedores sem Contrato" — unidades PURAS (node:test, sem DOM). Cobre a
 * agregação fornecedor→plano, a matemática do limite (%, restante, estouro estrito) e a formatação
 * (BRL, percentual zero-padded incl. negativo) e o CSV.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  aggregateSuppliers,
  formatBRL,
  formatPercent,
  buildCsv,
  parseLimiteToCents,
  formatLimiteInput,
  LIMITE_DEFAULT_CENTS,
} from '../../../../src/modules/reports/client/suppliers-without-contract.view-model.ts'
import { SUPPLIERS_WITHOUT_CONTRACT_RAW } from '../../../../src/modules/reports/client/data/suppliers-without-contract.placeholder.ts'

const find = (supplier: string) =>
  aggregateSuppliers(SUPPLIERS_WITHOUT_CONTRACT_RAW, LIMITE_DEFAULT_CENTS).find(
    (r) => r.supplier === supplier,
  )

describe('aggregateSuppliers — totais por fornecedor', () => {
  it('WEE TRAVEL soma 12.981,85 (dois planos) e ESTOURA o limite', () => {
    const wee = find('WEE TRAVEL')
    assert.ok(wee)
    assert.strictEqual(wee?.valorTotalCents, 1298185)
    assert.strictEqual(wee?.overLimit, true)
    assert.strictEqual(wee?.plans.length, 2)
  })

  it('TECNOVETTI soma 2.267,72', () => {
    assert.strictEqual(find('TECNOVETTI')?.valorTotalCents, 226772)
  })

  it('A3 TURISMO soma 9.070,56 (dois planos, incl. 2026)', () => {
    assert.strictEqual(find('A3 TURISMO LTDA')?.valorTotalCents, 907056)
  })

  it('Associação Bem Comum soma 10,80', () => {
    assert.strictEqual(find('Associação Bem Comum')?.valorTotalCents, 1080)
  })

  it('preserva a ORDEM DE INSERÇÃO dos fornecedores (não ordena por valor)', () => {
    const rows = aggregateSuppliers(SUPPLIERS_WITHOUT_CONTRACT_RAW, LIMITE_DEFAULT_CENTS)
    assert.strictEqual(rows[0]?.supplier, 'WEE TRAVEL')
    assert.strictEqual(rows[1]?.supplier, 'ANA SICILIA GUIMARAES FIGUEIREDO CORREIA')
    assert.strictEqual(rows.length, 12)
  })
})

describe('math do limite — % / restante / estouro estrito', () => {
  it('exatamente 100% NÃO estoura, mas fica "no limite" (cinza): overLimit=false, atLimit=true, restante=0', () => {
    const ana = find('ANA SICILIA GUIMARAES FIGUEIREDO CORREIA')
    assert.strictEqual(ana?.valorTotalCents, 1000000)
    assert.strictEqual(ana?.overLimit, false)
    assert.strictEqual(ana?.atLimit, true)
    assert.strictEqual(ana?.utilizadoPct, 100)
    assert.strictEqual(ana?.totalRestanteCents, 0)
  })

  it('estouro e dentro-do-limite NÃO são "no limite" (atLimit=false)', () => {
    assert.strictEqual(find('WEE TRAVEL')?.atLimit, false) // estourou (>100%)
    assert.strictEqual(find('TECNOVETTI')?.atLimit, false) // dentro (<100%)
  })

  it('WEE TRAVEL: % ~129,82 e restante NEGATIVO', () => {
    const wee = find('WEE TRAVEL')
    assert.strictEqual(formatPercent(wee?.utilizadoPct ?? 0), '129,82%')
    assert.strictEqual(wee?.totalRestanteCents, 1000000 - 1298185) // -298185
    assert.strictEqual(formatBRL(wee?.totalRestanteCents ?? 0), '-R$ 2.981,85')
  })

  it('utilizadoPct = valorTotal/limite*100; restante = limite - valorTotal', () => {
    const tec = find('TECNOVETTI')
    assert.strictEqual(tec?.utilizadoPct, (226772 / 1000000) * 100) // 22.6772
    assert.strictEqual(tec?.totalRestanteCents, 1000000 - 226772) // 773228
  })

  it('recalcula com outro limite (R$ 5.000,00): WEE TRAVEL a 259,637%', () => {
    const rows = aggregateSuppliers(SUPPLIERS_WITHOUT_CONTRACT_RAW, 500000)
    const wee = rows.find((r) => r.supplier === 'WEE TRAVEL')
    assert.strictEqual(wee?.utilizadoPct, (1298185 / 500000) * 100)
    assert.strictEqual(wee?.overLimit, true)
  })
})

describe('formatPercent — zero-pad de 2 dígitos inteiros', () => {
  it('formata como o print legado', () => {
    assert.strictEqual(formatPercent(129.82), '129,82%')
    assert.strictEqual(formatPercent(3.52), '03,52%')
    assert.strictEqual(formatPercent(0.11), '00,11%')
    assert.strictEqual(formatPercent(100), '100,00%')
    assert.strictEqual(formatPercent(0), '00,00%')
  })
})

describe('formatBRL — moeda BRL incl. negativo', () => {
  it('formata centavos', () => {
    assert.strictEqual(formatBRL(1298185), 'R$ 12.981,85')
    assert.strictEqual(formatBRL(1080), 'R$ 10,80')
    assert.strictEqual(formatBRL(-298185), '-R$ 2.981,85')
    assert.strictEqual(formatBRL(0), 'R$ 0,00')
  })
})

describe('parseLimiteToCents / formatLimiteInput — input currency ↔ cents', () => {
  it('parseia formatos pt-BR e cru', () => {
    assert.strictEqual(parseLimiteToCents('10.000,00'), 1000000)
    assert.strictEqual(parseLimiteToCents('10000,00'), 1000000)
    assert.strictEqual(parseLimiteToCents('10000.00'), 1000000)
    assert.strictEqual(parseLimiteToCents('R$ 5.000,00'), 500000)
    assert.strictEqual(parseLimiteToCents('1.234,56'), 123456)
  })
  it('entrada vazia/inválida cai no limite padrão', () => {
    assert.strictEqual(parseLimiteToCents(''), LIMITE_DEFAULT_CENTS)
    assert.strictEqual(parseLimiteToCents('abc'), LIMITE_DEFAULT_CENTS)
  })
  it('formata cents para exibição sem R$', () => {
    assert.strictEqual(formatLimiteInput(1000000), '10.000,00')
    assert.strictEqual(formatLimiteInput(500000), '5.000,00')
  })
})

describe('buildCsv — delimitado por ; com header legado', () => {
  it('header e uma linha por fornecedor→plano', () => {
    const rows = aggregateSuppliers(SUPPLIERS_WITHOUT_CONTRACT_RAW, LIMITE_DEFAULT_CENTS)
    const csv = buildCsv(rows)
    const lines = csv.split('\r\n')
    assert.strictEqual(lines[0], '"Fornecedor";"BudgetPlan";"Total"')
    assert.strictEqual(lines[1], '"WEE TRAVEL";"2025 PARC 1.0";"7137,13"')
    assert.strictEqual(lines[2], '"WEE TRAVEL";"2025 EPV 1.0";"5844,72"')
    // 17 linhas de dados (pares fornecedor→plano) + 1 header.
    assert.strictEqual(lines.length, 18)
  })
})
