/**
 * Fonte REAL do Dashboard (puro, node:test) — specs/096 P1. Formatação (BRL / variação / participação),
 * assembler cost-centers → DashboardAggregations (com interinos nas partes P2/P3/sem-endpoint) e a
 * degradação por widget (err do client → interino, sem derrubar o Dashboard).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  formatBRLFromCents,
  formatVariationPercent,
  formatSharePercent,
  assembleAggregationsFromCostCenters,
  createGetDashboardAggregationsReal,
} from '../../../../../src/modules/financial/server/adapters/dashboard-statistics.real-source.ts'
import { PLACEHOLDER_AGGREGATIONS } from '../../../../../src/modules/financial/server/adapters/dashboard-statistics.placeholder-source.ts'
import { ok, err, isOk } from '../../../../../src/shared/primitives/result.ts'
import type { DashboardCostCenters } from '../../../../../src/modules/financial/server/domain/dashboard.io.ts'
import type { FinancialClient } from '../../../../../src/modules/financial/server/application/financial.use-cases.ts'

const cc: DashboardCostCenters = {
  totalExpenses: 4_500_000,
  variation: { absoluteCents: 500_000, percentage: { kind: 'value', percent: 12.5 } },
  topCostCenter: { ref: 'cc-1', name: 'Estratégico', totalCents: 2_000_000 },
  distribution: [
    { ref: 'cc-1', name: 'Estratégico', totalCents: 2_000_000, percentage: 44.4 },
    { ref: null, name: null, totalCents: 500_000, percentage: 11.1 },
  ],
}

describe('formatBRLFromCents', () => {
  it('centavos → real com milhar e centavos', () => {
    assert.match(formatBRLFromCents(1_234_56), /1\.234,56/)
    assert.match(formatBRLFromCents(0), /^R\$/)
  })
})

describe('formatVariationPercent', () => {
  it('value: assinado com "%"', () => {
    assert.equal(formatVariationPercent({ kind: 'value', percent: 12.5 }), '+12,5%')
    assert.match(formatVariationPercent({ kind: 'value', percent: -8.3 }), /8,3%$/)
  })
  it('no-change → "0%"', () => {
    assert.equal(formatVariationPercent({ kind: 'no-change' }), '0%')
  })
  it('new → "+"', () => {
    assert.equal(formatVariationPercent({ kind: 'new' }), '+')
  })
})

describe('formatSharePercent', () => {
  it('participação arredondada', () => {
    assert.equal(formatSharePercent(2_000_000, 4_500_000), '44%')
  })
  it('guarda divisão por zero', () => {
    assert.equal(formatSharePercent(100, 0), '0%')
  })
})

describe('assembleAggregationsFromCostCenters', () => {
  it('liga Despesas + Top Centro + donut; mantém interinos no resto', () => {
    const agg = assembleAggregationsFromCostCenters(cc)
    // Despesas: valor formatado + variação real.
    assert.match(agg.metrics.expenses.value, /45.000,00/)
    assert.equal(agg.metrics.expenses.trendPercent, '+12,5%')
    // Top Centro: nome + participação.
    assert.equal(agg.metrics.topCostCenter.value, 'Estratégico')
    assert.equal(agg.metrics.topCostCenter.trendPercent, '44%')
    // Donut: nome real vira labelKey (verbatim via t); CC nulo cai na key i18n.
    assert.equal(agg.costCenters[0]?.labelKey, 'Estratégico')
    assert.equal(agg.costCenters[0]?.id, 'cc-1')
    assert.equal(agg.costCenters[1]?.labelKey, 'dashboard.cost-center.slice.none')
    assert.equal(agg.costCenters[1]?.id, 'cc-null-1') // ref nulo → id sintético
    // Interinos: Receita/Maior-Financiador/séries/fornecedores = placeholder.
    assert.deepEqual(agg.metrics.revenue, PLACEHOLDER_AGGREGATIONS.metrics.revenue)
    assert.deepEqual(agg.metrics.topFinancier, PLACEHOLDER_AGGREGATIONS.metrics.topFinancier)
    assert.deepEqual(agg.monthlyForecast, PLACEHOLDER_AGGREGATIONS.monthlyForecast)
    assert.deepEqual(agg.suppliersWithoutContract, PLACEHOLDER_AGGREGATIONS.suppliersWithoutContract)
  })

  it('topCostCenter nulo → valor neutro e 0%', () => {
    const agg = assembleAggregationsFromCostCenters({ ...cc, topCostCenter: null })
    assert.equal(agg.metrics.topCostCenter.value, '—')
    assert.equal(agg.metrics.topCostCenter.trendPercent, '0%')
  })
})

// Client fake mínimo — só o método que a fonte real usa.
const fakeClient = (impl: FinancialClient['getDashboardCostCenters']): FinancialClient =>
  ({ getDashboardCostCenters: impl }) as unknown as FinancialClient

describe('createGetDashboardAggregationsReal', () => {
  it('client ok → agregações reais', async () => {
    const source = createGetDashboardAggregationsReal({ client: fakeClient(() => Promise.resolve(ok(cc))) })
    const r = await source('token')
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.match(r.value.metrics.expenses.value, /45.000,00/)
  })

  it('client err → DEGRADA para o interino (Dashboard não cai)', async () => {
    const source = createGetDashboardAggregationsReal({
      client: fakeClient(() => Promise.resolve(err('forbidden'))),
    })
    const r = await source('token')
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.deepEqual(r.value, PLACEHOLDER_AGGREGATIONS)
  })
})
