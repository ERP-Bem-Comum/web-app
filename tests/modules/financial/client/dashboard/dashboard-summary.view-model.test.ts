/**
 * dashboard-summary.view-model (node:test) — NÚCLEO PURO (043). Verifica as constantes placeholder:
 * as 4 métricas (ids/accents esperados), as 2 séries do gráfico (12 pontos por série, valores no
 * domínio [0, yMax]), os ticks do eixo Y e o donut vazio. Imports RELATIVOS.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  METRIC_CARDS,
  CHART_SERIES,
  CHART_Y_MAX,
  CHART_Y_TICKS,
  DONUT_SLICES,
  SUPPLIERS_WITHOUT_CONTRACT,
  LIMITE_CENTS,
  deriveSupplierComplianceBars,
  formatSupplierBRL,
  formatSupplierPercent,
} from '../../../../../src/modules/financial/client/dashboard/dashboard-summary.view-model.ts'

describe('dashboard-summary view-model', () => {
  it('METRIC_CARDS tem 4 itens com ids únicos e os esperados', () => {
    assert.equal(METRIC_CARDS.length, 4)
    const ids = METRIC_CARDS.map((c) => c.id)
    assert.deepEqual(ids, ['expenses', 'revenue', 'top-financier', 'top-cost-center'])
    // ids únicos
    assert.equal(new Set(ids).size, 4)
  })

  it('METRIC_CARDS tem os accents esperados por id', () => {
    const accentById = new Map(METRIC_CARDS.map((c) => [c.id, c.accent]))
    assert.equal(accentById.get('expenses'), 'red')
    assert.equal(accentById.get('revenue'), 'green')
    assert.equal(accentById.get('top-financier'), 'indigo')
    assert.equal(accentById.get('top-cost-center'), 'orange')
  })

  it('CHART_SERIES tem 2 séries (forecast/realized)', () => {
    assert.equal(CHART_SERIES.length, 2)
    assert.deepEqual(
      CHART_SERIES.map((s) => s.id),
      ['forecast', 'realized'],
    )
  })

  it('cada série tem 12 pontos (month 0..11) com value em [0, CHART_Y_MAX]', () => {
    for (const series of CHART_SERIES) {
      assert.equal(series.points.length, 12)
      series.points.forEach((p, i) => {
        assert.equal(p.month, i)
        assert.ok(p.value >= 0, `${series.id} month ${String(i)} value >= 0`)
        assert.ok(p.value <= CHART_Y_MAX, `${series.id} month ${String(i)} value <= CHART_Y_MAX`)
      })
    }
  })

  it('CHART_Y_TICKS = [4.5M, 9M, 13.5M, 18M] (escala em reais)', () => {
    assert.deepEqual(CHART_Y_TICKS, [4_500_000, 9_000_000, 13_500_000, 18_000_000])
  })

  it('DONUT_SLICES tem os centros de custo placeholder (labelKey + value>0 + tone)', () => {
    assert.equal(DONUT_SLICES.length, 4)
    for (const s of DONUT_SLICES) {
      assert.ok(s.labelKey.startsWith('dashboard.cost-center.slice.'))
      assert.ok(s.value > 0)
      assert.ok(['c1', 'c2', 'c3', 'c4'].includes(s.tone))
    }
    // Tons distintos (um por fatia) — legibilidade do donut.
    assert.equal(new Set(DONUT_SLICES.map((s) => s.tone)).size, DONUT_SLICES.length)
  })
})

describe('SUPPLIERS_WITHOUT_CONTRACT (compliance placeholder)', () => {
  it('tem o shape novo (id/name/valorTotalCents inteiro) e ids únicos', () => {
    assert.ok(SUPPLIERS_WITHOUT_CONTRACT.length >= 1)
    for (const s of SUPPLIERS_WITHOUT_CONTRACT) {
      assert.equal(typeof s.id, 'string')
      assert.equal(typeof s.name, 'string')
      assert.ok(Number.isInteger(s.valorTotalCents), `${s.id} valorTotalCents inteiro`)
      assert.ok(s.valorTotalCents > 0)
    }
    const ids = SUPPLIERS_WITHOUT_CONTRACT.map((s) => s.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('LIMITE_CENTS = R$ 10.000,00 (1.000.000 centavos)', () => {
    assert.equal(LIMITE_CENTS, 1_000_000)
  })

  it('o mix placeholder inclui over/at/within perante o limite', () => {
    const bars = deriveSupplierComplianceBars(SUPPLIERS_WITHOUT_CONTRACT, LIMITE_CENTS)
    const statuses = new Set(bars.map((b) => b.status))
    assert.ok(statuses.has('over'), 'tem fornecedor ACIMA do limite')
    assert.ok(statuses.has('at'), 'tem fornecedor NO limite')
    assert.ok(statuses.has('within'), 'tem fornecedor DENTRO do limite')
  })
})

describe('deriveSupplierComplianceBars', () => {
  const INPUT = [
    { id: 'small', name: 'SMALL', valorTotalCents: 500_000 },
    { id: 'over', name: 'OVER', valorTotalCents: 1_298_185 },
    { id: 'at', name: 'AT', valorTotalCents: 1_000_000 },
  ] as const

  it('classifica status por comparação ESTRITA (>limite=over, ==limite=at, <limite=within)', () => {
    const byId = new Map(deriveSupplierComplianceBars(INPUT, 1_000_000).map((b) => [b.id, b]))
    assert.equal(byId.get('over')?.status, 'over')
    assert.equal(byId.get('at')?.status, 'at') // 100% exato NÃO estoura
    assert.equal(byId.get('small')?.status, 'within')
  })

  it('ordena DECRESCENTE por valorTotalCents (top ofensores primeiro)', () => {
    const order = deriveSupplierComplianceBars(INPUT, 1_000_000).map((b) => b.id)
    assert.deepEqual(order, ['over', 'at', 'small'])
  })

  it('calcula utilizadoPct = valorTotal / limite * 100 (pode passar de 100)', () => {
    const byId = new Map(deriveSupplierComplianceBars(INPUT, 1_000_000).map((b) => [b.id, b]))
    assert.ok(Math.abs((byId.get('over')?.utilizadoPct ?? 0) - 129.8185) < 1e-9)
    assert.equal(byId.get('at')?.utilizadoPct, 100)
    assert.equal(byId.get('small')?.utilizadoPct, 50)
  })

  it('não muta a entrada (§VII)', () => {
    const input = [...INPUT]
    deriveSupplierComplianceBars(input, 1_000_000)
    assert.deepEqual(
      input.map((s) => s.id),
      ['small', 'over', 'at'],
    )
  })

  it('limite 0 → utilizadoPct 0 (sem divisão por zero)', () => {
    const bars = deriveSupplierComplianceBars(INPUT, 0)
    for (const b of bars) assert.equal(b.utilizadoPct, 0)
  })
})

describe('formatação de compliance', () => {
  it('formatSupplierBRL: centavos → "R$ 12.981,85"', () => {
    assert.equal(formatSupplierBRL(1_298_185), 'R$ 12.981,85')
    assert.equal(formatSupplierBRL(1_000_000), 'R$ 10.000,00')
  })

  it('formatSupplierPercent: 2 dígitos inteiros zero-padded + 2 decimais', () => {
    assert.equal(formatSupplierPercent(129.8185), '129,82%')
    assert.equal(formatSupplierPercent(100), '100,00%')
    assert.equal(formatSupplierPercent(12.8), '12,80%')
    assert.equal(formatSupplierPercent(5), '05,00%')
  })
})
