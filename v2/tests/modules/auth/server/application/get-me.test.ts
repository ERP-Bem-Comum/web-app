/**
 * get-me use-case — Bearer → core-api /me → { userId }. TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createGetMe } from '../../../../../src/modules/auth/server/application/get-me.use-case.ts'
import { ok, err, isOk, isErr, type Result } from '../../../../../src/shared/primitives/result.ts'
import type { AuthUser } from '../../../../../src/modules/auth/server/domain/session.types.ts'
import type { AuthError } from '../../../../../src/modules/auth/server/domain/auth.errors.ts'

describe('get-me', () => {
  it('ok → { userId }', async () => {
    const client = { me: (): Promise<Result<AuthUser, AuthError>> => Promise.resolve(ok({ userId: 'u' })) }
    const r = await createGetMe({ client })('access')
    assert.equal(isOk(r) && r.value.userId === 'u', true)
  })
  it('unauthorized → err(unauthorized)', async () => {
    const client = { me: (): Promise<Result<AuthUser, AuthError>> => Promise.resolve(err('unauthorized')) }
    const r = await createGetMe({ client })('access')
    assert.equal(isErr(r) && r.error === 'unauthorized', true)
  })
})
