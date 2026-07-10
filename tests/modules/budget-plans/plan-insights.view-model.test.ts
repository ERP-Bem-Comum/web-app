/**
 * Testes puros (feature 060) de `buildInsightsView`: rótulos em BRL, delta de cada ano anterior FRENTE ao ano
 * atual e o tom (subiu/desceu/igual). Sem DOM.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { buildInsightsView } from '#modules/budget-plans/client/planejamento/detalhe/plan-insights.view-model.ts'
import type { BudgetPlanInsights } from '#modules/budget-plans/client/data/model/plan-actions.model.ts'

const insights: BudgetPlanInsights = {
  current: { year: 2027, totalInCents: 300_000 },
  previousYears: [
    { year: 2026, totalInCents: 200_000 }, // atual > anterior ⇒ up
    { year: 2025, totalInCents: 400_000 }, // atual < anterior ⇒ down
    { year: 2024, totalInCents: 300_000 }, // igual ⇒ flat
  ],
}

describe('buildInsightsView', () => {
  const view = buildInsightsView(insights)

  it('deriva o cabeçalho do ano atual', () => {
    assert.equal(view.currentYear, 2027)
    assert.ok(view.currentTotalLabel.includes('3.000,00'))
  })

  it('gera uma linha por ano anterior, na ordem', () => {
    assert.deepEqual(
      view.rows.map((r) => r.year),
      [2026, 2025, 2024],
    )
  })

  it('classifica o tom do delta (up/down/flat)', () => {
    assert.equal(view.rows[0]?.deltaTone, 'up')
    assert.equal(view.rows[1]?.deltaTone, 'down')
    assert.equal(view.rows[2]?.deltaTone, 'flat')
  })

  it('rotula o delta com sinal explícito', () => {
    assert.ok(view.rows[0]?.deltaLabel.startsWith('+ '))
    assert.ok(view.rows[1]?.deltaLabel.startsWith('- '))
    assert.equal(view.rows[2]?.deltaTone, 'flat')
  })

  it('sem anos anteriores → nenhuma linha', () => {
    const empty = buildInsightsView({ current: { year: 2027, totalInCents: 0 }, previousYears: [] })
    assert.equal(empty.rows.length, 0)
  })
})
