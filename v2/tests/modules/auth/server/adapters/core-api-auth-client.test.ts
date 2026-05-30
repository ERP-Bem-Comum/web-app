/**
 * core-api auth client — chama /api/v2/auth/* via resultFetch (globalThis.fetch stubado).
 * Mapeia o envelope de erro (por `code`) → AuthError. NUNCA lança. TDD: escrito ANTES da impl.
 */
import { describe, it, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'

import { createCoreApiAuthClient } from '#modules/auth/server/adapters/core-api/core-api-auth.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'

const BASE = 'http://core/api/v2'
const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const errEnvelope = (code: string) => ({ error: { code, message: code, requestId: 'r1' } })

describe('login', () => {
  it('200 → ok(AuthTokens)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(200, { accessToken: 'a', refreshToken: 'r', userId: 'u' }))
    const r = await createCoreApiAuthClient(BASE).login({ email: 'e', password: 'p' })
    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(r.value.userId, 'u')
  })
  it('401 invalid-credentials → err(invalid-credentials)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(401, errEnvelope('invalid-credentials')))
    const r = await createCoreApiAuthClient(BASE).login({ email: 'e', password: 'p' })
    assert.equal(isErr(r) && r.error === 'invalid-credentials', true)
  })
  it('403 user-disabled → err(user-disabled)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(403, errEnvelope('user-disabled')))
    const r = await createCoreApiAuthClient(BASE).login({ email: 'e', password: 'p' })
    assert.equal(isErr(r) && r.error === 'user-disabled', true)
  })
})

describe('refresh', () => {
  it('200 → ok(AuthTokens novo)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(200, { accessToken: 'a2', refreshToken: 'r2', userId: 'u' }))
    const r = await createCoreApiAuthClient(BASE).refresh('r1')
    assert.equal(isOk(r) && r.value.refreshToken === 'r2', true)
  })
  it('401 refresh-token-rotated → err(refresh-rotated)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(401, errEnvelope('refresh-token-rotated')))
    const r = await createCoreApiAuthClient(BASE).refresh('r1')
    assert.equal(isErr(r) && r.error === 'refresh-rotated', true)
  })
})

describe('logout', () => {
  it('204 → ok', async () => {
    globalThis.fetch = () => Promise.resolve(new Response(null, { status: 204 }))
    const r = await createCoreApiAuthClient(BASE).logout('r1')
    assert.equal(isOk(r), true)
  })
})

describe('me', () => {
  it('200 → ok({userId})', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(200, { userId: 'u' }))
    const r = await createCoreApiAuthClient(BASE).me('access')
    assert.equal(isOk(r) && r.value.userId === 'u', true)
  })
  it('401 unauthorized → err(unauthorized)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(401, errEnvelope('unauthorized')))
    const r = await createCoreApiAuthClient(BASE).me('access')
    assert.equal(isErr(r) && r.error === 'unauthorized', true)
  })
})

describe('transporte', () => {
  it('fetch rejeita (rede) → err(connectivity)', async () => {
    globalThis.fetch = () => Promise.reject(new TypeError('conn'))
    const r = await createCoreApiAuthClient(BASE).login({ email: 'e', password: 'p' })
    assert.equal(isErr(r) && r.error === 'connectivity', true)
  })
})
