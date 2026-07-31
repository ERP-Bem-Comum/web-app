/**
 * Use-case do gráfico Realizado × Previsto (node:test) — specs/096 P3. Orquestração: opções, fan-out do
 * "todos somados", seleção de 1 plano, estado vazio e fail-closed (plano faltante NÃO vira zero).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createGetDashboardRealized } from '../../../../../src/modules/financial/server/application/dashboard-realized.use-cases.ts'
import type { DashboardRealizedClient } from '../../../../../src/modules/financial/server/application/dashboard-realized.use-cases.ts'
import { ok, err, isOk, isErr } from '../../../../../src/shared/primitives/result.ts'
import type { RealizedPoint } from '../../../../../src/modules/financial/server/domain/dashboard-realized.io.ts'

const series = (expected: number, realized: number): readonly RealizedPoint[] =>
  Array.from({ length: 12 }, (_, month) => ({ month, expectedCents: expected, realizedCents: realized }))

const client = (over: Partial<DashboardRealizedClient>): DashboardRealizedClient => ({
  listApprovedPlans: () =>
    Promise.resolve(
      ok([
        { id: 'p1', label: 'ABC · v1.0' },
        { id: 'p2', label: 'XYZ · v1.0' },
      ]),
    ),
  getRealizedSeries: () => Promise.resolve(ok(series(100_00, 50_00))),
  ...over,
})

describe('createGetDashboardRealized', () => {
  it('all: fan-out soma todos os aprovados; options preenchidas', async () => {
    const calls: string[] = []
    const uc = createGetDashboardRealized({
      client: client({
        getRealizedSeries: (id) => {
          calls.push(id)
          return Promise.resolve(ok(series(100_00, 50_00)))
        },
      }),
    })
    const r = await uc({ year: 2026, selection: { kind: 'all' } }, 'tok')
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.deepEqual(calls.sort(), ['p1', 'p2'])
    assert.equal(r.value.options.length, 2)
    assert.equal(r.value.empty, false)
    // 2 planos × R$ 100,00 previsto = R$ 200,00 no mês 0.
    assert.equal(r.value.chart.series[0]?.points[0]?.value, 200)
  })

  it('plan: busca só o plano escolhido', async () => {
    const calls: string[] = []
    const uc = createGetDashboardRealized({
      client: client({
        getRealizedSeries: (id) => {
          calls.push(id)
          return Promise.resolve(ok(series(300_00, 100_00)))
        },
      }),
    })
    const r = await uc({ year: 2026, selection: { kind: 'plan', budgetPlanId: 'p2' } }, 'tok')
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.deepEqual(calls, ['p2'])
    assert.equal(r.value.chart.series[0]?.points[0]?.value, 300)
  })

  it('sem plano aprovado → empty:true, chart zerado', async () => {
    const uc = createGetDashboardRealized({
      client: client({ listApprovedPlans: () => Promise.resolve(ok([])) }),
    })
    const r = await uc({ year: 2026, selection: { kind: 'all' } }, 'tok')
    assert.ok(isOk(r))
    if (!isOk(r)) return
    assert.equal(r.value.empty, true)
    assert.equal(r.value.options.length, 0)
    assert.equal(r.value.chart.series[0]?.points[0]?.value, 0)
  })

  it('erro ao listar planos → propaga o erro', async () => {
    const uc = createGetDashboardRealized({
      client: client({ listApprovedPlans: () => Promise.resolve(err('forbidden')) }),
    })
    const r = await uc({ year: 2026, selection: { kind: 'all' } }, 'tok')
    assert.ok(isErr(r))
    if (!isErr(r)) return
    assert.equal(r.error, 'forbidden')
  })

  it('fail-closed: um plano falha no fan-out → chart indisponível (err), não soma zero', async () => {
    const uc = createGetDashboardRealized({
      client: client({
        getRealizedSeries: (id) =>
          id === 'p2' ? Promise.resolve(err('server')) : Promise.resolve(ok(series(100_00, 50_00))),
      }),
    })
    const r = await uc({ year: 2026, selection: { kind: 'all' } }, 'tok')
    assert.ok(isErr(r))
    if (!isErr(r)) return
    assert.equal(r.error, 'server')
  })
})
