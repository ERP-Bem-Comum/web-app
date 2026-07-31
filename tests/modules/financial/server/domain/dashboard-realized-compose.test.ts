/**
 * Composição pura do gráfico Realizado × Previsto (node:test) — specs/096 P3. Soma de séries (fan-out),
 * eixo Y dinâmico (nice numbers) e conversão centavos → REAIS.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  sumRealizedSeries,
  niceYAxis,
  composeRealizedChart,
  emptyRealizedChart,
} from '../../../../../src/modules/financial/server/domain/dashboard-realized.compose.ts'
import type { RealizedPoint } from '../../../../../src/modules/financial/server/domain/dashboard-realized.io.ts'

const plan = (expected: number, realized: number): readonly RealizedPoint[] =>
  Array.from({ length: 12 }, (_, month) => ({ month, expectedCents: expected, realizedCents: realized }))

describe('sumRealizedSeries', () => {
  it('soma mês a mês as séries de vários planos', () => {
    const { expectedCents, realizedCents } = sumRealizedSeries([plan(100, 50), plan(200, 30)])
    assert.equal(expectedCents.length, 12)
    assert.equal(expectedCents[0], 300)
    assert.equal(realizedCents[0], 80)
  })
  it('ignora mês fora de 0..11 (robustez de drift)', () => {
    const { expectedCents } = sumRealizedSeries([[{ month: 99, expectedCents: 1, realizedCents: 1 }]])
    assert.equal(
      expectedCents.reduce((a, b) => a + b, 0),
      0,
    )
  })
  it('lista vazia → vetores zerados de 12', () => {
    const { expectedCents } = sumRealizedSeries([])
    assert.equal(expectedCents.length, 12)
    assert.equal(expectedCents[5], 0)
  })
})

describe('niceYAxis', () => {
  it('arredonda p/ 1/2/5×10^n e dá 4 ticks', () => {
    assert.deepEqual(niceYAxis(1200), { yMax: 2000, yTicks: [500, 1000, 1500, 2000] })
    assert.deepEqual(niceYAxis(4300), { yMax: 5000, yTicks: [1250, 2500, 3750, 5000] })
  })
  it('max ≤ 0 → escala mínima default', () => {
    assert.deepEqual(niceYAxis(0), { yMax: 1000, yTicks: [250, 500, 750, 1000] })
  })
})

describe('composeRealizedChart', () => {
  it('centavos → REAIS, 2 séries de 12 pontos, eixo dinâmico', () => {
    const expected = Array.from({ length: 12 }, () => 1_000_00) // R$ 1.000,00
    const realized = Array.from({ length: 12 }, () => 500_00)
    const chart = composeRealizedChart(expected, realized)
    assert.equal(chart.months, 12)
    assert.equal(chart.series.length, 2)
    assert.equal(chart.series[0]?.id, 'forecast')
    assert.equal(chart.series[0]?.points[0]?.value, 1000) // REAIS
    assert.equal(chart.series[1]?.points[0]?.value, 500)
    assert.equal(chart.yMax, 1000) // max REAIS = 1000 → nice = 1000
  })
})

describe('emptyRealizedChart', () => {
  it('séries zeradas + escala mínima', () => {
    const chart = emptyRealizedChart()
    assert.equal(chart.series[0]?.points[0]?.value, 0)
    assert.equal(chart.yMax, 1000)
  })
})
