/**
 * dashboard.composition (node:test) — composição PURA do BFF (052). Verifica que
 * `composeDashboardStatistics` monta o `DashboardStatisticsDto` correto a partir das agregações CRUAS:
 *  - 4 métricas na ordem/accent/icon/labelKeys de layout, valores vindos da fonte;
 *  - 2 séries (forecast/realized) com 1 ponto por mês (month index) a partir dos arrays mensais;
 *  - distribuição com tons c1..c4 atribuídos por ORDEM;
 *  - TOP-N de fornecedores em rank DECRESCENTE (sem mutar a entrada);
 *  - limite de dispensa e config do gráfico (yMax/yTicks/months). Imports RELATIVOS.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { composeDashboardStatistics } from '../../../../../src/modules/financial/server/domain/dashboard.composition.ts'
import type { DashboardAggregations } from '../../../../../src/modules/financial/server/domain/dashboard.io.ts'

const AGG: DashboardAggregations = {
  metrics: {
    expenses: { value: 'R$ 0,00', trendPercent: '0%' },
    revenue: { value: 'R$ 0,00', trendPercent: '0%' },
    topFinancier: { value: '0%', trendPercent: '0%' },
    topCostCenter: { value: 'R$ 0,00', trendPercent: '0%' },
  },
  monthlyForecast: [
    6_000_000, 9_000_000, 13_500_000, 9_500_000, 8_900_000, 16_500_000, 7_000_000, 9_500_000, 8_500_000,
    7_500_000, 9_500_000, 7_500_000,
  ],
  monthlyRealized: [
    4_200_000, 6_800_000, 10_900_000, 7_600_000, 6_900_000, 12_800_000, 5_400_000, 7_700_000, 6_600_000,
    5_900_000, 7_500_000, 6_000_000,
  ],
  costCenters: [
    { id: 'strategic', labelKey: 'dashboard.cost-center.slice.strategic', valueCents: 4_500_000 },
    { id: 'logistics', labelKey: 'dashboard.cost-center.slice.logistics', valueCents: 3_200_000 },
    { id: 'admin', labelKey: 'dashboard.cost-center.slice.admin', valueCents: 2_800_000 },
    { id: 'events', labelKey: 'dashboard.cost-center.slice.events', valueCents: 1_500_000 },
  ],
  suppliersWithoutContract: [
    { id: 'polo-moveis', name: 'POLO MOVEIS', valorTotalCents: 742_000 },
    { id: 'wee-travel', name: 'WEE TRAVEL', valorTotalCents: 1_298_185 },
    { id: 'ana-sicilia', name: 'ANA SICILIA', valorTotalCents: 1_000_000 },
    { id: 'a3-turismo', name: 'A3 TURISMO', valorTotalCents: 1_142_000 },
  ],
}

describe('composeDashboardStatistics — métricas (layout)', () => {
  const dto = composeDashboardStatistics(AGG)

  it('monta os 4 cards na ordem com accent/icon/labelKeys de layout', () => {
    assert.equal(dto.metrics.length, 4)
    assert.deepEqual(
      dto.metrics.map((m) => m.id),
      ['expenses', 'revenue', 'top-financier', 'top-cost-center'],
    )
    const expenses = dto.metrics[0]
    assert.equal(expenses?.accent, 'red')
    assert.equal(expenses?.icon, 'wallet')
    assert.equal(expenses?.labelKey, 'dashboard.metric.expenses.label')
    assert.equal(expenses?.trendLabelKey, 'dashboard.metric.expenses.trend')
    // valor vem da FONTE (composição não reformata enquanto INTERINO)
    assert.equal(expenses?.value, 'R$ 0,00')
    assert.equal(dto.metrics[2]?.accent, 'indigo')
    assert.equal(dto.metrics[3]?.icon, 'users')
  })
})

describe('composeDashboardStatistics — gráfico', () => {
  const dto = composeDashboardStatistics(AGG)

  it('config do eixo: 12 meses, yMax 18M, ticks [4.5M,9M,13.5M,18M]', () => {
    assert.equal(dto.chart.months, 12)
    assert.equal(dto.chart.yMax, 18_000_000)
    assert.deepEqual(dto.chart.yTicks, [4_500_000, 9_000_000, 13_500_000, 18_000_000])
  })

  it('2 séries (forecast/realized) com 1 ponto por mês (index sequencial) e valores dos arrays', () => {
    assert.deepEqual(
      dto.chart.series.map((s) => s.id),
      ['forecast', 'realized'],
    )
    const forecast = dto.chart.series[0]
    assert.equal(forecast?.points.length, 12)
    assert.deepEqual(forecast?.points[0], { month: 0, value: 6_000_000 })
    assert.deepEqual(forecast?.points[2], { month: 2, value: 13_500_000 })
    const realized = dto.chart.series[1]
    assert.deepEqual(realized?.points[11], { month: 11, value: 6_000_000 })
  })
})

describe('composeDashboardStatistics — distribuição e fornecedores', () => {
  const dto = composeDashboardStatistics(AGG)

  it('distribuição preserva valueCents e atribui tons c1..c4 por ordem', () => {
    assert.deepEqual(
      dto.costCenterDistribution.map((s) => s.tone),
      ['c1', 'c2', 'c3', 'c4'],
    )
    assert.equal(dto.costCenterDistribution[0]?.valueCents, 4_500_000)
    assert.equal(dto.costCenterDistribution[0]?.labelKey, 'dashboard.cost-center.slice.strategic')
  })

  it('TOP-N de fornecedores em rank DECRESCENTE por valor', () => {
    assert.deepEqual(
      dto.suppliersWithoutContract.map((s) => s.id),
      ['wee-travel', 'a3-turismo', 'ana-sicilia', 'polo-moveis'],
    )
  })

  it('não muta a lista crua de fornecedores (§VII)', () => {
    const before = AGG.suppliersWithoutContract.map((s) => s.id)
    composeDashboardStatistics(AGG)
    assert.deepEqual(
      AGG.suppliersWithoutContract.map((s) => s.id),
      before,
    )
  })

  it('expõe o limite de dispensa (R$ 10.000,00 = 1.000.000 centavos)', () => {
    assert.equal(dto.dispenseLimitCents, 1_000_000)
  })
})
