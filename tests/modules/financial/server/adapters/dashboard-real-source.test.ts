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
  buildSuppliers,
  assembleAggregations,
  createGetDashboardAggregationsReal,
} from '../../../../../src/modules/financial/server/adapters/dashboard-statistics.real-source.ts'
import { PLACEHOLDER_AGGREGATIONS } from '../../../../../src/modules/financial/server/adapters/dashboard-statistics.placeholder-source.ts'
import { ok, err, isOk } from '../../../../../src/shared/primitives/result.ts'
import type {
  DashboardCostCenters,
  DashboardNoContractSupplier,
} from '../../../../../src/modules/financial/server/domain/dashboard.io.ts'
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

const suppliers: readonly DashboardNoContractSupplier[] = [
  { supplierRef: 'sup-1', name: 'WEE TRAVEL', totalCents: 1_298_185 },
  { supplierRef: 'sup-2', name: null, totalCents: 435_000 },
]

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

describe('buildSuppliers', () => {
  it('mapeia ref/nome/total; nome nulo → símbolo neutro', () => {
    const out = buildSuppliers(suppliers)
    assert.equal(out[0]?.id, 'sup-1')
    assert.equal(out[0]?.name, 'WEE TRAVEL')
    assert.equal(out[0]?.valorTotalCents, 1_298_185)
    assert.equal(out[1]?.name, '—')
  })
})

describe('assembleAggregations', () => {
  it('cost-centers + suppliers reais; Despesas/Top Centro/donut/fornecedores ligados', () => {
    const agg = assembleAggregations({ costCenters: cc, suppliers })
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
    // Fornecedores (P2): reais, não mais o placeholder.
    assert.equal(agg.suppliersWithoutContract[0]?.id, 'sup-1')
    assert.equal(agg.suppliersWithoutContract.length, 2)
    // Interinos que seguem: Receita/Maior-Financiador/séries.
    assert.deepEqual(agg.metrics.revenue, PLACEHOLDER_AGGREGATIONS.metrics.revenue)
    assert.deepEqual(agg.metrics.topFinancier, PLACEHOLDER_AGGREGATIONS.metrics.topFinancier)
    assert.deepEqual(agg.monthlyForecast, PLACEHOLDER_AGGREGATIONS.monthlyForecast)
  })

  it('topCostCenter nulo → valor neutro e 0%', () => {
    const agg = assembleAggregations({ costCenters: { ...cc, topCostCenter: null }, suppliers })
    assert.equal(agg.metrics.topCostCenter.value, '—')
    assert.equal(agg.metrics.topCostCenter.trendPercent, '0%')
  })

  it('DEGRADAÇÃO por-widget: cost-centers nulo → SÓ essa parte cai no interino, suppliers segue real', () => {
    const agg = assembleAggregations({ costCenters: null, suppliers })
    assert.deepEqual(agg.metrics.expenses, PLACEHOLDER_AGGREGATIONS.metrics.expenses)
    assert.deepEqual(agg.costCenters, PLACEHOLDER_AGGREGATIONS.costCenters)
    assert.equal(agg.suppliersWithoutContract[0]?.id, 'sup-1') // real, não interino
  })

  it('DEGRADAÇÃO por-widget: suppliers nulo → SÓ fornecedores no interino, cost-centers segue real', () => {
    const agg = assembleAggregations({ costCenters: cc, suppliers: null })
    assert.match(agg.metrics.expenses.value, /45.000,00/) // real
    assert.deepEqual(agg.suppliersWithoutContract, PLACEHOLDER_AGGREGATIONS.suppliersWithoutContract)
  })

  it('ambos nulos → interino completo', () => {
    const agg = assembleAggregations({ costCenters: null, suppliers: null })
    assert.deepEqual(agg, PLACEHOLDER_AGGREGATIONS)
  })
})

// Client fake mínimo — só os métodos que a fonte real usa (cost-centers + suppliers).
const fakeClient = (
  cost: FinancialClient['getDashboardCostCenters'],
  sup: FinancialClient['getDashboardNoContractSuppliers'],
): FinancialClient =>
  ({ getDashboardCostCenters: cost, getDashboardNoContractSuppliers: sup }) as unknown as FinancialClient

describe('createGetDashboardAggregationsReal', () => {
  it('ambos ok → agregações reais (cost-centers + suppliers)', async () => {
    const source = createGetDashboardAggregationsReal({
      client: fakeClient(
        () => Promise.resolve(ok(cc)),
        () => Promise.resolve(ok(suppliers)),
      ),
    })
    const r = await source('token')
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.match(r.value.metrics.expenses.value, /45.000,00/)
    assert.equal(r.value.suppliersWithoutContract[0]?.id, 'sup-1')
  })

  it('cost-centers err + suppliers ok → só cost-centers degrada (por-widget)', async () => {
    const source = createGetDashboardAggregationsReal({
      client: fakeClient(
        () => Promise.resolve(err('forbidden')),
        () => Promise.resolve(ok(suppliers)),
      ),
    })
    const r = await source('token')
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.deepEqual(r.value.metrics.expenses, PLACEHOLDER_AGGREGATIONS.metrics.expenses)
    assert.equal(r.value.suppliersWithoutContract[0]?.id, 'sup-1')
  })

  it('ambos err → interino completo (Dashboard não cai)', async () => {
    const source = createGetDashboardAggregationsReal({
      client: fakeClient(
        () => Promise.resolve(err('connectivity')),
        () => Promise.resolve(err('forbidden')),
      ),
    })
    const r = await source('token')
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.deepEqual(r.value, PLACEHOLDER_AGGREGATIONS)
  })
})
