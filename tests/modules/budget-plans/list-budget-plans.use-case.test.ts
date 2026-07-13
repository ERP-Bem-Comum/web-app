/**
 * Use-case da LISTA de Planejamento (#372/#373): agora que o core projeta `partnersCount`/`networkKind` e o
 * `updatedByRef`, o use-case NÃO faz mais fan-out por item — mapeia direto e resolve o nome do autor em UMA
 * chamada deduplicada. Cobre: mapeamento de rede (incl. mista/null), partnersCount, e a resolução do autor.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { ok, isOk } from '#shared/primitives/result.ts'
import {
  createListBudgetPlans,
  type BudgetPlansCoreClient,
  type RawPlanItem,
  type ResolveUserNames,
} from '#modules/budget-plans/server/application/list-budget-plans.use-case.ts'

const rawItem = (over: Partial<RawPlanItem>): RawPlanItem => ({
  id: 'p1',
  year: 2026,
  status: 'RASCUNHO',
  version: '1.0',
  programRef: 'prog-1',
  programName: 'Prog',
  totalInCents: 0,
  updatedAt: '2026-07-12T00:00:00.000Z',
  updatedByRef: null,
  partnersCount: 0,
  networkKind: null,
  ...over,
})

const clientOf = (items: readonly RawPlanItem[]): BudgetPlansCoreClient => ({
  listBudgetPlans: () => Promise.resolve(ok({ items, total: items.length })),
  getProgramOptions: () => Promise.resolve(ok([{ ref: 'prog-1', abbreviation: 'PG' }])),
})

const params = { page: 1, limit: 10 } as const
const noNames: ResolveUserNames = () => Promise.resolve(new Map())

describe('createListBudgetPlans — #372 networkKind + partnersCount', () => {
  it('mapeia state/municipality/mixed/null → ESTADO/MUNICIPIO/MISTO/ESTADO e passa partnersCount', async () => {
    const client = clientOf([
      rawItem({ id: 'a', networkKind: 'state', partnersCount: 2 }),
      rawItem({ id: 'b', networkKind: 'municipality', partnersCount: 5 }),
      rawItem({ id: 'c', networkKind: 'mixed', partnersCount: 7 }),
      rawItem({ id: 'd', networkKind: null, partnersCount: 0 }),
    ])
    const res = await createListBudgetPlans({ client, resolveUserNames: noNames })(params, 'tok')
    assert.ok(isOk(res))
    assert.deepEqual(
      res.value.items.map((i) => i.networkKind),
      ['ESTADO', 'MUNICIPIO', 'MISTO', 'ESTADO'],
    )
    assert.deepEqual(
      res.value.items.map((i) => i.partnersCount),
      [2, 5, 7, 0],
    )
  })
})

describe('createListBudgetPlans — #373 autor resolvido em 1 chamada deduplicada', () => {
  it('resolve updatedByName; ref null → null; ref não resolvido → null; dedup de refs', async () => {
    const calls: (readonly string[])[] = []
    const resolve: ResolveUserNames = (refs) => {
      calls.push(refs)
      return Promise.resolve(new Map(refs.filter((r) => r !== 'ghost').map((r) => [r, `Nome-${r}`])))
    }
    const client = clientOf([
      rawItem({ id: 'a', updatedByRef: 'u1' }),
      rawItem({ id: 'b', updatedByRef: 'u1' }), // mesmo autor → dedup
      rawItem({ id: 'c', updatedByRef: 'u2' }),
      rawItem({ id: 'd', updatedByRef: null }), // sem autor
      rawItem({ id: 'e', updatedByRef: 'ghost' }), // não resolvido
    ])
    const res = await createListBudgetPlans({ client, resolveUserNames: resolve })(params, 'tok')
    assert.ok(isOk(res))
    const names = res.value.items.map((i) => i.updatedByName)
    assert.deepEqual(names, ['Nome-u1', 'Nome-u1', 'Nome-u2', null, null])
    // uma única chamada, com refs deduplicados (u1, u2, ghost)
    assert.equal(calls.length, 1)
    assert.deepEqual([...(calls[0] ?? [])].sort(), ['ghost', 'u1', 'u2'])
  })

  it('sem nenhum updatedByRef → não chama resolveUserNames', async () => {
    let called = false
    const resolve: ResolveUserNames = () => {
      called = true
      return Promise.resolve(new Map())
    }
    const client = clientOf([rawItem({ id: 'a', updatedByRef: null })])
    await createListBudgetPlans({ client, resolveUserNames: resolve })(params, 'tok')
    assert.equal(called, false)
  })
})
