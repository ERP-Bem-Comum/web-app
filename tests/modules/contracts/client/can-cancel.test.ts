/**
 * canCancelContract — gating do cancelamento (§1.7): só contratos Pendente podem ser cancelados.
 * node:test puro (imports `#`).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import { canCancelContract } from '#modules/contracts/client/data/model/contracts.model.ts'

describe('canCancelContract', () => {
  it('é true apenas para Pendente', () => {
    assert.strictEqual(canCancelContract('Pendente'), true)
  })

  it('é false para os demais status', () => {
    assert.strictEqual(canCancelContract('Em Andamento'), false)
    assert.strictEqual(canCancelContract('Finalizado'), false)
    assert.strictEqual(canCancelContract('Distrato'), false)
    assert.strictEqual(canCancelContract('Cancelado'), false)
  })
})
