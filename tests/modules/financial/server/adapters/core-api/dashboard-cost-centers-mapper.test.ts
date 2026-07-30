/**
 * Mapper do cost-centers do Dashboard (puro, node:test) — specs/096 P1. Parse tolerante da resposta real
 * de `GET /financial/dashboard/cost-centers`: happy, `topCostCenter` nulo, variantes da união de variação,
 * e drift → err('server'). Import relativo (os #alias da fonte resolvem via package.json "imports").
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  dashboardCostCentersToModel,
  dashboardNoContractSuppliersToModel,
} from '../../../../../../src/modules/financial/server/adapters/core-api/financial.mappers.ts'
import { isOk, isErr } from '../../../../../../src/shared/primitives/result.ts'

const validRaw = {
  totalExpenses: 4_500_000,
  variation: { absoluteCents: 500_000, percentage: { kind: 'value', percent: 12.5 } },
  topCostCenter: { ref: 'cc-1', name: 'Estratégico', totalCents: 2_000_000 },
  distribution: [
    { ref: 'cc-1', name: 'Estratégico', totalCents: 2_000_000, percentage: 44.4 },
    { ref: null, name: null, totalCents: 500_000, percentage: 11.1 },
  ],
}

describe('dashboardCostCentersToModel', () => {
  it('parseia a resposta real (happy) preservando números e a união de variação', () => {
    const r = dashboardCostCentersToModel(validRaw)
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.equal(r.value.totalExpenses, 4_500_000)
    assert.equal(r.value.variation.percentage.kind, 'value')
    assert.equal(r.value.topCostCenter?.name, 'Estratégico')
    assert.equal(r.value.distribution.length, 2)
    assert.equal(r.value.distribution[1]?.ref, null)
  })

  it('aceita topCostCenter nulo (sem despesa paga em M-1)', () => {
    const r = dashboardCostCentersToModel({ ...validRaw, topCostCenter: null })
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.equal(r.value.topCostCenter, null)
  })

  it('aceita variação no-change e new', () => {
    for (const percentage of [{ kind: 'no-change' }, { kind: 'new' }]) {
      const r = dashboardCostCentersToModel({
        ...validRaw,
        variation: { absoluteCents: 0, percentage },
      })
      assert.ok(isOk(r), `deveria aceitar ${percentage.kind}`)
    }
  })

  it('é tolerante a campo extra do backend (sem .strict)', () => {
    const r = dashboardCostCentersToModel({ ...validRaw, futureField: 42 })
    assert.ok(isOk(r))
  })

  it('drift estrutural → err(server)', () => {
    const r = dashboardCostCentersToModel({ totalExpenses: 'muito' })
    assert.ok(isErr(r))
    if (!isErr(r)) return
    assert.equal(r.error, 'server')
  })
})

describe('dashboardNoContractSuppliersToModel', () => {
  const validRaw = {
    suppliers: [
      { supplierRef: 'sup-1', name: 'WEE TRAVEL', totalCents: 1_298_185 },
      { supplierRef: 'sup-2', name: null, totalCents: 435_000 },
    ],
  }

  it('desembrulha .suppliers preservando a ordem/rank', () => {
    const r = dashboardNoContractSuppliersToModel(validRaw)
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.equal(r.value.length, 2)
    assert.equal(r.value[0]?.supplierRef, 'sup-1')
    assert.equal(r.value[1]?.name, null)
  })

  it('lista vazia é válida', () => {
    const r = dashboardNoContractSuppliersToModel({ suppliers: [] })
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.equal(r.value.length, 0)
  })

  it('drift (sem suppliers) → err(server)', () => {
    const r = dashboardNoContractSuppliersToModel({})
    assert.ok(isErr(r))
    if (!isErr(r)) return
    assert.equal(r.error, 'server')
  })
})
