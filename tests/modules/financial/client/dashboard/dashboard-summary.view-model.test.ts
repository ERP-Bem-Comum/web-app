/**
 * dashboard-summary.view-model (node:test) — NÚCLEO PURO (052). Agora o view-model DERIVA o
 * `DashboardStatistics` (server-state composto pelo BFF) → props das views. Verifica as derivações puras:
 *  - `toMetricCards`/`toChartSeries`/`toDonutSlices` (mapeamento fiel do DTO, incl. valueCents→value);
 *  - `deriveSupplierComplianceBars` (status estrito, ordenação, %, sem mutação, limite 0);
 *  - formatadores (BRL + percent). Imports RELATIVOS; fixture de DTO local (sem rede).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  toMetricCards,
  toChartSeries,
  toDonutSlices,
  deriveSupplierComplianceBars,
  formatSupplierBRL,
  formatSupplierPercent,
} from '../../../../../src/modules/financial/client/dashboard/dashboard-summary.view-model.ts'
import type { DashboardStatistics } from '../../../../../src/modules/financial/client/data/model/dashboard-statistics.model.ts'

// Fixture de DTO (o formato que o BFF entrega). Valores fiéis ao placeholder atual.
const STATS: DashboardStatistics = {
  metrics: [
    {
      id: 'expenses',
      labelKey: 'dashboard.metric.expenses.label',
      value: 'R$ 0,00',
      trendPercent: '0%',
      trendLabelKey: 'dashboard.metric.expenses.trend',
      accent: 'red',
      icon: 'wallet',
    },
    {
      id: 'revenue',
      labelKey: 'dashboard.metric.revenue.label',
      value: 'R$ 0,00',
      trendPercent: '0%',
      trendLabelKey: 'dashboard.metric.revenue.trend',
      accent: 'green',
      icon: 'trending-up',
    },
    {
      id: 'top-financier',
      labelKey: 'dashboard.metric.top-financier.label',
      value: '0%',
      trendPercent: '0%',
      trendLabelKey: 'dashboard.metric.top-financier.trend',
      accent: 'indigo',
      icon: 'heart-handshake',
    },
    {
      id: 'top-cost-center',
      labelKey: 'dashboard.metric.top-cost-center.label',
      value: 'R$ 0,00',
      trendPercent: '0%',
      trendLabelKey: 'dashboard.metric.top-cost-center.trend',
      accent: 'orange',
      icon: 'users',
    },
  ],
  chart: {
    months: 12,
    yMax: 18_000_000,
    yTicks: [4_500_000, 9_000_000, 13_500_000, 18_000_000],
    series: [
      {
        id: 'forecast',
        labelKey: 'dashboard.chart.series.forecast',
        points: Array.from({ length: 12 }, (_, m) => ({ month: m, value: m * 1_000_000 })),
      },
      {
        id: 'realized',
        labelKey: 'dashboard.chart.series.realized',
        points: Array.from({ length: 12 }, (_, m) => ({ month: m, value: m * 800_000 })),
      },
    ],
  },
  costCenterDistribution: [
    { id: 'strategic', labelKey: 'dashboard.cost-center.slice.strategic', valueCents: 4_500_000, tone: 'c1' },
    { id: 'logistics', labelKey: 'dashboard.cost-center.slice.logistics', valueCents: 3_200_000, tone: 'c2' },
    { id: 'admin', labelKey: 'dashboard.cost-center.slice.admin', valueCents: 2_800_000, tone: 'c3' },
    { id: 'events', labelKey: 'dashboard.cost-center.slice.events', valueCents: 1_500_000, tone: 'c4' },
  ],
  suppliersWithoutContract: [
    { id: 'wee-travel', name: 'WEE TRAVEL', valorTotalCents: 1_298_185 },
    { id: 'ana-sicilia', name: 'ANA SICILIA', valorTotalCents: 1_000_000 },
    { id: 'polo-moveis', name: 'POLO MOVEIS', valorTotalCents: 742_000 },
  ],
  dispenseLimitCents: 1_000_000,
}

describe('dashboard-summary view-model — derivações do DTO', () => {
  it('toMetricCards devolve os 4 cards do DTO com ids/accents esperados', () => {
    const cards = toMetricCards(STATS)
    assert.equal(cards.length, 4)
    assert.deepEqual(
      cards.map((c) => c.id),
      ['expenses', 'revenue', 'top-financier', 'top-cost-center'],
    )
    const accentById = new Map(cards.map((c) => [c.id, c.accent]))
    assert.equal(accentById.get('expenses'), 'red')
    assert.equal(accentById.get('revenue'), 'green')
    assert.equal(accentById.get('top-financier'), 'indigo')
    assert.equal(accentById.get('top-cost-center'), 'orange')
  })

  it('toChartSeries devolve 2 séries (forecast/realized) com 12 pontos cada', () => {
    const series = toChartSeries(STATS)
    assert.deepEqual(
      series.map((s) => s.id),
      ['forecast', 'realized'],
    )
    for (const s of series) {
      assert.equal(s.points.length, 12)
      s.points.forEach((p, i) => {
        assert.equal(p.month, i)
      })
    }
  })

  it('toDonutSlices mapeia valueCents→value e preserva labelKey/tone (tons distintos)', () => {
    const slices = toDonutSlices(STATS)
    assert.equal(slices.length, 4)
    assert.equal(slices[0]?.value, 4_500_000) // valueCents vira value
    assert.equal(slices[0]?.tone, 'c1')
    for (const s of slices) assert.ok(s.labelKey.startsWith('dashboard.cost-center.slice.'))
    assert.equal(new Set(slices.map((s) => s.tone)).size, slices.length)
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

  it('o mix do DTO inclui over/at/within perante o limite', () => {
    const bars = deriveSupplierComplianceBars(STATS.suppliersWithoutContract, STATS.dispenseLimitCents)
    const statuses = new Set(bars.map((b) => b.status))
    assert.ok(statuses.has('over'))
    assert.ok(statuses.has('at'))
    assert.ok(statuses.has('within'))
  })
})

describe('formatação de compliance', () => {
  it('formatSupplierBRL: centavos → "R$ 12.981,85" (NBSP do Intl pt-BR)', () => {
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
