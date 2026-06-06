/**
 * RBAC puro do client (FR-020). TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { can } from '#modules/partners/client/data/helpers/can.ts'

describe('can', () => {
  it('concede quando a permissão está presente', () => {
    assert.equal(can(['collaborator:write'], 'collaborator:write'), true)
  })
  it('nega quando a permissão está ausente', () => {
    assert.equal(can(['collaborator:read'], 'collaborator:write'), false)
  })
  it('nega com lista vazia (degradado: sem permissões → sem escrita)', () => {
    assert.equal(can([], 'geography:write'), false)
  })
})
