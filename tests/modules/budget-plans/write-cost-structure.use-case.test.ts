/**
 * Testes dos use-cases de ESCRITA da estrutura de custo (feature 061 — Grupo B). Cada caso é um pass-through
 * para o port (`WriteCostStructureClient`): o use-case só encaminha comando + token e propaga o `Result`. Cobre
 * (a) o comando chega intacto ao client; (b) `ok` da árvore-eco e (c) `err` propagam.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { ok, err } from '#shared/primitives/result.ts'
import {
  createAddCostCenter,
  createAddCategory,
  createAddSubcategory,
  type WriteCostStructureClient,
} from '#modules/budget-plans/server/application/write-cost-structure.use-case.ts'
import type { CostStructureTree } from '#modules/budget-plans/server/domain/cost-structure-write.io.ts'

const TREE: CostStructureTree = {
  budgetPlanId: 'a1b2c3d4-1111-4a2b-8c3d-000000000001',
  costCenters: [
    {
      ref: 'c1c1c1c1-1111-4a2b-8c3d-000000000010',
      name: 'Consultoria',
      direction: 'A PAGAR',
      categories: [],
    },
  ],
}

/** Client-duplo que registra a última chamada e devolve um Result configurável. */
const makeClient = (): {
  client: WriteCostStructureClient
  calls: { method: string; command: unknown; token: string }[]
} => {
  const calls: { method: string; command: unknown; token: string }[] = []
  const client: WriteCostStructureClient = {
    addCostCenter: (command, token) => {
      calls.push({ method: 'addCostCenter', command, token })
      return Promise.resolve(ok(TREE))
    },
    addCategory: (command, token) => {
      calls.push({ method: 'addCategory', command, token })
      return Promise.resolve(ok(TREE))
    },
    addSubcategory: (command, token) => {
      calls.push({ method: 'addSubcategory', command, token })
      return Promise.resolve(err('budget-plan-not-editable'))
    },
  }
  return { client, calls }
}

describe('write-cost-structure use-cases', () => {
  it('createAddCostCenter encaminha o comando + token e devolve a árvore-eco (ok)', async () => {
    const { client, calls } = makeClient()
    const command = { planId: 'p1', name: 'Comunicação', direction: 'A PAGAR' } as const
    const res = await createAddCostCenter({ client })(command, 'tok')
    assert.equal(res.ok, true)
    assert.deepEqual(calls[0], { method: 'addCostCenter', command, token: 'tok' })
  })

  it('createAddCategory encaminha o comando (costCenterId por uuid)', async () => {
    const { client, calls } = makeClient()
    const command = {
      planId: 'p1',
      costCenterId: 'c1c1c1c1-1111-4a2b-8c3d-000000000010',
      name: 'Cat',
    } as const
    const res = await createAddCategory({ client })(command, 'tok')
    assert.equal(res.ok, true)
    assert.deepEqual(calls[0]?.command, command)
  })

  it('createAddSubcategory propaga o erro do client (err)', async () => {
    const { client } = makeClient()
    const command = {
      planId: 'p1',
      categoryId: 'ca7e9017-2222-4a2b-8c3d-000000000020',
      name: 'Sub',
      launchType: 'IPCA',
    } as const
    const res = await createAddSubcategory({ client })(command, 'tok')
    assert.equal(res.ok, false)
    if (!res.ok) assert.equal(res.error, 'budget-plan-not-editable')
  })
})
