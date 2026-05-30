/**
 * login use-case — valida → core-api login → cria Session → store. TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createLogin } from '../../../../../src/modules/auth/server/application/login.use-case.ts'
import { createMemorySessionStore } from '../../../../../src/external/session/session-store.memory.ts'
import { ok, err, isOk, isErr, type Result } from '../../../../../src/shared/primitives/result.ts'
import type { Session, SessionId, AuthTokens } from '../../../../../src/modules/auth/server/domain/session.types.ts'
import type { AuthError } from '../../../../../src/modules/auth/server/domain/auth.errors.ts'

const deps = (login: () => Promise<Result<AuthTokens, AuthError>>) => {
  const store = createMemorySessionStore<Session>({ now: () => 1_000 })
  return {
    store,
    run: createLogin({
      client: { login },
      store,
      now: () => 1_000,
      decodeExp: () => 9_000_000,
      genId: () => 'sid-1' as SessionId,
    }),
  }
}

describe('login use-case', () => {
  it('sucesso → ok(Session) + grava no store; persistent = rememberDevice', async () => {
    const { store, run } = deps(() => Promise.resolve(ok({ accessToken: 'a', refreshToken: 'r', userId: 'u' })))

    const r = await run({ email: 'admin@bemcomum.dev', password: 'p', rememberDevice: true })

    assert.equal(isOk(r), true)
    if (isOk(r)) {
      assert.equal(r.value.userId, 'u')
      assert.equal(r.value.persistent, true)
      assert.equal(r.value.accessExpiresAt, 9_000_000)
    }
    assert.equal(isOk(await store.get('sid-1')), true)
  })

  it('invalid-credentials do backend → err', async () => {
    const { run } = deps(() => Promise.resolve(err('invalid-credentials')))
    const r = await run({ email: 'admin@bemcomum.dev', password: 'x', rememberDevice: false })
    assert.equal(isErr(r) && r.error === 'invalid-credentials', true)
  })

  it('email com formato inválido → err(invalid-credentials) sem chamar backend (anti-enumeração)', async () => {
    let called = 0
    const { run } = deps(() => {
      called += 1
      return Promise.resolve(ok({ accessToken: 'a', refreshToken: 'r', userId: 'u' }))
    })
    const r = await run({ email: 'not-an-email', password: 'p', rememberDevice: false })
    assert.equal(isErr(r) && r.error === 'invalid-credentials', true)
    assert.equal(called, 0)
  })
})
