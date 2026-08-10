/**
 * core-api auth client — chama /api/v2/auth/* via resultFetch (globalThis.fetch stubado).
 * Mapeia o envelope de erro (por `code`) → AuthError. NUNCA lança. TDD: escrito ANTES da impl.
 */
import { describe, it, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'

import { createCoreApiAuthClient } from '#modules/auth/server/adapters/core-api/core-api-auth.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'

const BASE = 'http://core/api/v2'
const BASE_V1 = 'http://core/api/v1' // aprovadores (#148) vivem em /api/v1
const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const errEnvelope = (code: string) => ({ error: { code, message: code, requestId: 'r1' } })

describe('login', () => {
  it('200 → ok(AuthTokens)', async () => {
    globalThis.fetch = () =>
      Promise.resolve(jsonResponse(200, { accessToken: 'a', refreshToken: 'r', userId: 'u' }))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).login({ email: 'e', password: 'p' })
    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(r.value.userId, 'u')
  })
  it('401 invalid-credentials → err(invalid-credentials)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(401, errEnvelope('invalid-credentials')))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).login({ email: 'e', password: 'p' })
    assert.equal(isErr(r) && r.error === 'invalid-credentials', true)
  })
  it('403 user-disabled → err(user-disabled)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(403, errEnvelope('user-disabled')))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).login({ email: 'e', password: 'p' })
    assert.equal(isErr(r) && r.error === 'user-disabled', true)
  })
})

describe('refresh', () => {
  it('200 → ok(AuthTokens novo)', async () => {
    globalThis.fetch = () =>
      Promise.resolve(jsonResponse(200, { accessToken: 'a2', refreshToken: 'r2', userId: 'u' }))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).refresh('r1')
    assert.equal(isOk(r) && r.value.refreshToken === 'r2', true)
  })
  it('401 refresh-token-rotated → err(refresh-rotated)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(401, errEnvelope('refresh-token-rotated')))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).refresh('r1')
    assert.equal(isErr(r) && r.error === 'refresh-rotated', true)
  })
})

describe('logout', () => {
  it('204 → ok', async () => {
    globalThis.fetch = () => Promise.resolve(new Response(null, { status: 204 }))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).logout('r1')
    assert.equal(isOk(r), true)
  })
})

describe('me', () => {
  it('200 → ok({userId})', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(200, { userId: 'u' }))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).me('access')
    assert.equal(isOk(r) && r.value.userId === 'u', true)
  })
  it('401 unauthorized → err(unauthorized)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(401, errEnvelope('unauthorized')))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).me('access')
    assert.equal(isErr(r) && r.error === 'unauthorized', true)
  })
})

describe('transporte', () => {
  it('fetch rejeita (rede) → err(connectivity)', async () => {
    globalThis.fetch = () => Promise.reject(new TypeError('conn'))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).login({ email: 'e', password: 'p' })
    assert.equal(isErr(r) && r.error === 'connectivity', true)
  })
})

describe('forgotPassword (#037 — POST /auth/forgot-password, anti-enumeração)', () => {
  it('202 → ok (SEMPRE completa, sem revelar se o e-mail existe)', async () => {
    globalThis.fetch = () => Promise.resolve(new Response(null, { status: 202 }))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).forgotPassword({ email: 'a@b.com' })
    assert.equal(isOk(r), true)
  })
  it('rede (fetch rejeita) → err(connectivity)', async () => {
    globalThis.fetch = () => Promise.reject(new TypeError('conn'))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).forgotPassword({ email: 'a@b.com' })
    assert.equal(isErr(r) && r.error === 'connectivity', true)
  })
  it('500 → err(server)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(500, errEnvelope('boom')))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).forgotPassword({ email: 'a@b.com' })
    assert.equal(isErr(r) && r.error === 'server', true)
  })
})

describe('resetPassword (#038 — POST /auth/reset-password)', () => {
  it('2xx → ok', async () => {
    globalThis.fetch = () => Promise.resolve(new Response(null, { status: 204 }))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).resetPassword({
      token: 't',
      newPassword: 'Aa1!aaaaaaaa',
    })
    assert.equal(isOk(r), true)
  })
  it('400 → err(reset-token-invalid) — mapeado por STATUS (link inválido/expirado/usado)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(400, errEnvelope('some-generic-code')))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).resetPassword({
      token: 't',
      newPassword: 'Aa1!aaaaaaaa',
    })
    assert.equal(isErr(r) && r.error === 'reset-token-invalid', true)
  })
  it('rede (fetch rejeita) → err(connectivity)', async () => {
    globalThis.fetch = () => Promise.reject(new TypeError('conn'))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).resetPassword({
      token: 't',
      newPassword: 'Aa1!aaaaaaaa',
    })
    assert.equal(isErr(r) && r.error === 'connectivity', true)
  })
  it('500 → err(server)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(500, errEnvelope('boom')))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).resetPassword({
      token: 't',
      newPassword: 'Aa1!aaaaaaaa',
    })
    assert.equal(isErr(r) && r.error === 'server', true)
  })
})

describe('listApprovers (#148 — GET /api/v1/approvers)', () => {
  it('200 → mapeia items; name null cai p/ o id', async () => {
    globalThis.fetch = () =>
      Promise.resolve(
        jsonResponse(200, {
          items: [
            { id: 'u1', name: 'Ana' },
            { id: 'u2', name: null },
          ],
        }),
      )
    const r = await createCoreApiAuthClient(BASE, BASE_V1).listApprovers('tok')
    assert.equal(isOk(r), true)
    if (isOk(r)) {
      assert.equal(r.value.length, 2)
      assert.deepEqual(r.value[0], { id: 'u1', name: 'Ana' })
      assert.equal(r.value[1]?.name, 'u2') // fallback p/ o id
    }
  })
  it('403 → err(server) (slug não mapeado vira server)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(403, errEnvelope('forbidden')))
    const r = await createCoreApiAuthClient(BASE, BASE_V1).listApprovers('tok')
    assert.equal(isErr(r), true)
  })
})
