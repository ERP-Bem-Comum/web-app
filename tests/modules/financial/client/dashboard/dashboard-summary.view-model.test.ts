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

  it('DONUT_SLICES é vazio', () => {
    assert.equal(DONUT_SLICES.length, 0)
  })
})
