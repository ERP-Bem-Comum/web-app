/**
 * deriveCurrentUser (pura) — estado autenticado a partir do dado da query. TDD.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { deriveCurrentUser } from '#modules/auth/client/current-user/current-user.view-model.ts'

describe('deriveCurrentUser', () => {
  it('com usuário → autenticado', () => {
    assert.deepEqual(deriveCurrentUser({ userId: 'u', permissions: [] }), {
      user: { userId: 'u', permissions: [] },
      isAuthenticated: true,
    })
  })
  it('null → não autenticado', () => {
    assert.deepEqual(deriveCurrentUser(null), { user: null, isAuthenticated: false })
  })
  it('undefined (carregando) → não autenticado', () => {
    assert.deepEqual(deriveCurrentUser(undefined), { user: null, isAuthenticated: false })
  })
})
