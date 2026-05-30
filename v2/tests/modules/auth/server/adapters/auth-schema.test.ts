/**
 * Zod dos responses do core-api (boundary). TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { AuthTokensSchema, MeSchema } from '../../../../../src/modules/auth/server/adapters/auth.schema.ts'

describe('AuthTokensSchema', () => {
  it('aceita { accessToken, refreshToken, userId }', () => {
    const r = AuthTokensSchema.safeParse({ accessToken: 'a', refreshToken: 'r', userId: 'u' })
    assert.equal(r.success, true)
  })
  it('rejeita shape incompleto', () => {
    const r = AuthTokensSchema.safeParse({ accessToken: 'a' })
    assert.equal(r.success, false)
  })
})

describe('MeSchema', () => {
  it('aceita { userId }', () => {
    assert.equal(MeSchema.safeParse({ userId: 'u' }).success, true)
  })
  it('rejeita sem userId', () => {
    assert.equal(MeSchema.safeParse({}).success, false)
  })
})
