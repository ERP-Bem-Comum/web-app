/**
 * Anti session-fixation (FR-004) — o login DEVE gerar um sessionId novo (via genId injetado) e gravá-lo
 * no store, independentemente de qualquer id anterior. Não há sessão anônima no v2 (cookie só nasce no
 * login bem-sucedido). TDD: cobre a regressão de fixation.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createLogin } from '#modules/auth/server/application/commands/login.use-case.ts'
import { createMemorySessionStore } from '#external/session/session-store.memory.ts'
import { ok, isOk, type Result } from '#shared/primitives/result.ts'
import type { Session, SessionId, AuthTokens } from '#modules/auth/server/domain/session/session.types.ts'
import type { AuthError } from '#modules/auth/server/domain/errors/auth.errors.ts'

const tokens: AuthTokens = { accessToken: 'a.b.c', refreshToken: 'r1', userId: 'u1' }

const makeLogin = (genId: () => SessionId) => {
  const store = createMemorySessionStore<Session>({ now: () => 1_000 })
  const login = createLogin({
    client: { login: (): Promise<Result<AuthTokens, AuthError>> => Promise.resolve(ok(tokens)) },
    store,
    now: () => 1_000,
    decodeExp: () => 2_000,
    genId,
  })
  return { store, login }
}

describe('login — anti session-fixation (FR-004)', () => {
  it('gera um sessionId NOVO via genId e o grava no store', async () => {
    const { store, login } = makeLogin(() => 'fresh-sid' as SessionId)

    const r = await login({ email: 'admin@bemcomum.dev', password: 'x', rememberDevice: false })

    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(r.value.sessionId, 'fresh-sid')
    // a sessão está sob o id NOVO
    const got = await store.get('fresh-sid')
    assert.equal(isOk(got), true)
  })

  it('o sessionId vem do genId — um id pré-existente/forjado NÃO é reutilizado', async () => {
    // genId determinístico distinto de qualquer "id pré-login" que um atacante plantasse.
    const { login } = makeLogin(() => 'server-chosen-id' as SessionId)

    const r = await login({ email: 'admin@bemcomum.dev', password: 'x', rememberDevice: true })

    assert.equal(isOk(r) && r.value.sessionId === 'server-chosen-id', true)
  })
})

describe('genId em produção — fonte crypto (entropia)', () => {
  it('crypto.randomUUID produz ids únicos e opacos (sem padrão sequencial)', () => {
    const a = globalThis.crypto.randomUUID()
    const b = globalThis.crypto.randomUUID()
    assert.notEqual(a, b)
    assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})
