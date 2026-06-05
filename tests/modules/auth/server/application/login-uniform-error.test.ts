/**
 * Anti-enumeration (FR-013/SC-006) — o login do BFF NÃO pode revelar se a conta existe. Email com
 * formato inválido e credencial rejeitada pelo core-api devem produzir o MESMO erro `invalid-credentials`.
 * (O backend já é uniforme na mensagem; aqui garantimos que o BFF não introduz diferença.)
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createLogin } from '#modules/auth/server/application/commands/login.use-case.ts'
import { createMemorySessionStore } from '#external/session/session-store.memory.ts'
import { err, isErr, type Result } from '#shared/primitives/result.ts'
import type { Session, SessionId, AuthTokens } from '#modules/auth/server/domain/session/session.types.ts'
import type { AuthError } from '#modules/auth/server/domain/errors/auth.errors.ts'

const makeLogin = (clientLogin: () => Promise<Result<AuthTokens, AuthError>>) =>
  createLogin({
    client: { login: clientLogin },
    store: createMemorySessionStore<Session>({ now: () => 1_000 }),
    now: () => 1_000,
    decodeExp: () => 2_000,
    genId: () => 's' as SessionId,
  })

describe('login — erro uniforme (anti-enumeration, FR-013)', () => {
  it('email com formato inválido → invalid-credentials (sem chamar o backend)', async () => {
    let called = false
    const login = makeLogin(() => {
      called = true
      return Promise.resolve(err('server'))
    })

    const r = await login({ email: 'not-an-email', password: 'x', rememberDevice: false })

    assert.equal(isErr(r) && r.error === 'invalid-credentials', true)
    assert.equal(called, false) // nem chega ao core-api → indistinguível por timing de rede
  })

  it('credencial rejeitada pelo backend → mesmo invalid-credentials', async () => {
    const login = makeLogin(() => Promise.resolve(err('invalid-credentials')))

    const r = await login({ email: 'real@bemcomum.dev', password: 'wrong', rememberDevice: false })

    assert.equal(isErr(r) && r.error === 'invalid-credentials', true)
  })
})
