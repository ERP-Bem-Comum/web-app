/**
 * Testes da ViewModel PURA do relatório "Posição de Pagamentos" (node:test — sem DOM). Cobre:
 * (1) agregação folha → Centro de Custo → Fornecedor → Total Geral (soma das 3 medidas DERIVADAS);
 * (2) preservação da ordem de inserção e da estrutura de 3 níveis;
 * (3) `supplierTotals` (total por fornecedor, ordem decrescente) — fonte do gráfico de barras;
 * (4) o CSV builder (header pt-BR com as 3 medidas, uma linha por folha, valores BRL).
 *
 * As 3 medidas são DERIVADAS do estado real do Contas a Pagar: Em atraso (não pago + vencido), Pago
 * (liquidado), A pagar (não pago + a vencer). Ordem canônica: Em atraso · Pago · A pagar.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  aggregatePosicao,
  loadPosicao,
  supplierTotals,
  measureTotal,
  toRawPosicaoRows,
  buildCsv,
  formatBRL,
  CSV_HEADER,
  type PosicaoReport,
} from '#modules/reports/client/posicao.view-model.ts'
import type { PaymentPosition } from '#modules/reports/client/data/model/payment-position.model.ts'
import {
  POSICAO_PAGAMENTOS_RAW,
  type RawPosicaoRow,
} from '#modules/reports/client/data/posicao-pagamentos.placeholder.ts'

// Fixture pequena e determinística: 2 fornecedores, o 1º com 2 CCs (um com 2 categorias), o 2º com 1 CC.
const FIXTURE: readonly RawPosicaoRow[] = [
  {
    supplier: 'Alfa',
    costCenter: 'CC1',
    category: 'Cat A',
    emAtrasoCents: 100,
    pagoCents: 300,
    aPagarCents: 50,
  },
  {
    supplier: 'Alfa',
    costCenter: 'CC1',
    category: 'Cat B',
    emAtrasoCents: 10,
    pagoCents: 30,
    aPagarCents: 5,
  },
  { supplier: 'Alfa', costCenter: 'CC2', category: 'Cat C', emAtrasoCents: 1, pagoCents: 4, aPagarCents: 3 },
  {
    supplier: 'Beta',
    costCenter: 'CC9',
    category: 'Cat Z',
    emAtrasoCents: 1000,
    pagoCents: 0,
    aPagarCents: 700,
  },
]

describe('toRawPosicaoRows — mapeia a projeção do backend p/ as 3 medidas exclusivas', () => {
  // O backend: pendingCents = TODOS os não-pagos (inclui vencidos); overdueCents = os não-pagos vencidos
  // (subconjunto). "A pagar" na tela é só o A VENCER → pending − overdue (senão o vencido conta 2x).
  const mk = (over: Partial<PaymentPosition> = {}): PaymentPosition => ({
    supplierRef: 's1',
    supplierName: 'Alfa',
    costCenterRef: 'cc1',
    costCenterName: 'Administrativo',
    categoryRef: 'cat1',
    categoryName: 'Serviços',
    pendingCents: 0,
    paidCents: 0,
    overdueCents: 0,
    ...over,
  })

  it('aPagar = pending − overdue (o vencido NÃO conta em A pagar)', () => {
    // 100 não-pagos, dos quais 30 vencidos, 200 pagos → Em atraso 30 · Pago 200 · A pagar 70.
    const [row] = toRawPosicaoRows([mk({ pendingCents: 100, overdueCents: 30, paidCents: 200 })])
    assert.ok(row)
    assert.equal(row.emAtrasoCents, 30)
    assert.equal(row.pagoCents, 200)
    assert.equal(row.aPagarCents, 70) // 100 − 30
    // total = 300 (pago + não-pago), sem dupla contagem do vencido.
    assert.equal(measureTotal(row), 300)
  })

  it('tudo vencido → A pagar 0 (o caso da tela: Em atraso e A pagar não repetem o valor)', () => {
    const [row] = toRawPosicaoRows([mk({ pendingCents: 1000, overdueCents: 1000, paidCents: 0 })])
    assert.ok(row)
    assert.equal(row.emAtrasoCents, 1000)
    assert.equal(row.aPagarCents, 0)
    assert.equal(measureTotal(row), 1000)
  })

  it('favorecido/centro/categoria nulos → "—"', () => {
    const [row] = toRawPosicaoRows([mk({ supplierName: null, costCenterName: null, categoryName: null })])
    assert.equal(row?.supplier, '—')
    assert.equal(row?.costCenter, '—')
    assert.equal(row?.category, '—')
  })
})

describe('aggregatePosicao — soma folha → CC → fornecedor → total geral', () => {
  it('monta a árvore de 3 níveis preservando a ordem de inserção', () => {
    const r = aggregatePosicao(FIXTURE)
    assert.equal(r.suppliers.length, 2)
    assert.deepEqual(
      r.suppliers.map((s) => s.name),
      ['Alfa', 'Beta'],
    )
    const alfa = r.suppliers[0]
    assert.equal(alfa?.level, 'supplier')
    assert.equal(alfa?.children.length, 2)
    assert.deepEqual(
      alfa?.children.map((c) => c.name),
      ['CC1', 'CC2'],
    )
    const cc1 = alfa?.children[0]
    assert.equal(cc1?.level, 'costCenter')
    assert.deepEqual(
      cc1?.children.map((c) => c.name),
      ['Cat A', 'Cat B'],
    )
    assert.equal(cc1?.children[0]?.level, 'category')
    assert.equal(cc1?.children[0]?.children.length, 0)
  })

  it('a folha carrega exatamente as medidas da sua linha crua', () => {
    const r = aggregatePosicao(FIXTURE)
    const catA = r.suppliers[0]?.children[0]?.children[0]
    assert.equal(catA?.measures.emAtrasoCents, 100)
    assert.equal(catA?.measures.pagoCents, 300)
    assert.equal(catA?.measures.aPagarCents, 50)
  })

  it('o subtotal do Centro de Custo soma suas categorias', () => {
    const r = aggregatePosicao(FIXTURE)
    const cc1 = r.suppliers[0]?.children[0]
    assert.equal(cc1?.measures.emAtrasoCents, 110) // 100 + 10
    assert.equal(cc1?.measures.pagoCents, 330) // 300 + 30
    assert.equal(cc1?.measures.aPagarCents, 55) // 50 + 5
  })

  it('o subtotal do Fornecedor soma seus centros de custo', () => {
    const r = aggregatePosicao(FIXTURE)
    const alfa = r.suppliers[0]
    assert.equal(alfa?.measures.emAtrasoCents, 111) // 110 + 1
    assert.equal(alfa?.measures.pagoCents, 334) // 330 + 4
    assert.equal(alfa?.measures.aPagarCents, 58) // 55 + 3
  })

  it('o Total Geral soma todos os fornecedores', () => {
    const r = aggregatePosicao(FIXTURE)
    assert.equal(r.totals.emAtrasoCents, 1111) // 111 + 1000
    assert.equal(r.totals.pagoCents, 334) // 334 + 0
    assert.equal(r.totals.aPagarCents, 758) // 58 + 700
  })

  it('measureTotal soma as 3 medidas de um nó', () => {
    const r = aggregatePosicao(FIXTURE)
    const beta = r.suppliers[1]
    assert.equal(measureTotal(beta?.measures ?? r.totals), 1700) // 1000 + 0 + 700
  })

  it('árvore vazia → totais zero e sem fornecedores', () => {
    const r = aggregatePosicao([])
    assert.equal(r.suppliers.length, 0)
    assert.equal(r.totals.emAtrasoCents, 0)
    assert.equal(r.totals.pagoCents, 0)
    assert.equal(r.totals.aPagarCents, 0)
  })
})

describe('supplierTotals — total por fornecedor, ordem decrescente (barras)', () => {
  it('soma as 3 medidas por fornecedor e ordena do maior p/ o menor', () => {
    const totals = supplierTotals(aggregatePosicao(FIXTURE))
    assert.deepEqual(
      totals.map((s) => s.name),
      ['Beta', 'Alfa'], // Beta 1700 > Alfa 503
    )
    assert.equal(totals[0]?.valueCents, 1700)
    assert.equal(totals[1]?.valueCents, 503) // 111 + 334 + 58
  })
})

describe('loadPosicao — fonte da tela (front-first)', () => {
  it("type padrão 'p' agrega o placeholder de Pagamentos (não vazio)", () => {
    const r = loadPosicao()
    assert.ok(r.suppliers.length >= 4, 'placeholder tem vários fornecedores')
    assert.ok(measureTotal(r.totals) > 0)
  })

  it("'r' agrega o placeholder de RECEBIMENTOS (fonte distinta de 'p', não vazia)", () => {
    const rcv = loadPosicao('r')
    assert.ok(rcv.suppliers.length >= 4, 'placeholder de recebimentos tem vários financiadores')
    assert.ok(measureTotal(rcv.totals) > 0)
    // Fonte distinta da de Pagamentos (financiadores ≠ fornecedores) — engine NEUTRO, dados diferentes.
    const p = loadPosicao('p')
    assert.notDeepEqual(
      rcv.suppliers.map((s) => s.name),
      p.suppliers.map((s) => s.name),
    )
  })

  it('o Total Geral bate com a soma direta das linhas cruas do placeholder', () => {
    const r = loadPosicao('p')
    const sum = POSICAO_PAGAMENTOS_RAW.reduce(
      (acc, row) => ({
        emAtrasoCents: acc.emAtrasoCents + row.emAtrasoCents,
        pagoCents: acc.pagoCents + row.pagoCents,
        aPagarCents: acc.aPagarCents + row.aPagarCents,
      }),
      { emAtrasoCents: 0, pagoCents: 0, aPagarCents: 0 },
    )
    assert.equal(r.totals.emAtrasoCents, sum.emAtrasoCents)
    assert.equal(r.totals.pagoCents, sum.pagoCents)
    assert.equal(r.totals.aPagarCents, sum.aPagarCents)
  })
})

describe('buildCsv — CSV client-side fiel (header pt-BR, valores BRL)', () => {
  const report: PosicaoReport = aggregatePosicao(FIXTURE)

  it('a 1ª linha é o header pt-BR esperado (3 medidas)', () => {
    const lines = buildCsv(report).split('\r\n')
    assert.equal(lines[0], CSV_HEADER)
    assert.equal(lines[0], 'Fornecedor;Centro de custo;Categoria;Em atraso;Pago;A pagar')
  })

  it('emite uma linha por FOLHA (categoria) — 4 folhas na fixture', () => {
    const lines = buildCsv(report).split('\r\n')
    assert.equal(lines.length, 1 + 4) // header + 4 folhas
  })

  it('cada linha traz fornecedor/CC/categoria + as 3 medidas em BRL (Em atraso · Pago · A pagar)', () => {
    const lines = buildCsv(report).split('\r\n')
    assert.equal(lines[1], `"Alfa";"CC1";"Cat A";"${formatBRL(100)}";"${formatBRL(300)}";"${formatBRL(50)}"`)
    // Última folha (Beta / CC9 / Cat Z).
    assert.equal(lines[4], `"Beta";"CC9";"Cat Z";"${formatBRL(1000)}";"${formatBRL(0)}";"${formatBRL(700)}"`)
  })

  it('formatBRL formata centavos em BRL pt-BR', () => {
    // Intl usa NBSP (U+00A0) entre "R$" e o número — normaliza p/ espaço comum antes de comparar.
    const norm = (s: string): string => s.replace(/\s/g, ' ')
    assert.equal(norm(formatBRL(123456)), 'R$ 1.234,56')
    assert.equal(norm(formatBRL(0)), 'R$ 0,00')
  })
})
