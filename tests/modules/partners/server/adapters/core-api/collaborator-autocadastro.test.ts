/**
 * core-api-collaborator-autocadastro (#040) — client PÚBLICO que chama /api/v1/collaborators/autocadastro
 * via resultFetch (globalThis.fetch stubado). NUNCA lança (tudo é Result). Cobre a semântica específica:
 * 404 → autocadastro-invalid; 400 slug cpf-mismatch → autocadastro-cpf-mismatch; outros 400 → validation;
 * rede → connectivity; 200 preview parseia; 200 submit → ok.
 */
import { describe, it, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'

import { createCoreApiCollaboratorAutocadastroClient } from '#modules/partners/server/adapters/core-api/core-api-collaborator-autocadastro.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'
import type { AutocadastroSubmitInput } from '#modules/partners/server/domain/collaborator/collaborator-autocadastro.io.ts'

const BASE = 'http://core/api/v1'
const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const errEnvelope = (code: string) => ({ error: { code, message: code, requestId: 'r1' } })

const client = () => createCoreApiCollaboratorAutocadastroClient(BASE)

const submitInput: AutocadastroSubmitInput = { token: 't', cpfPrefix: '123' }

describe('preview (GET)', () => {
  it('200 → ok(AutocadastroPreview)', async () => {
    globalThis.fetch = () =>
      Promise.resolve(jsonResponse(200, { collaboratorId: 'c1', name: 'Ana', cpfMasked: '***.***.789-**' }))
    const r = await client().preview('t')
    assert.equal(isOk(r), true)
    if (isOk(r)) {
      assert.equal(r.value.collaboratorId, 'c1')
      assert.equal(r.value.name, 'Ana')
      assert.equal(r.value.cpfMasked, '***.***.789-**')
    }
  })

  it('404 → err(autocadastro-invalid) — anti-enumeração', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(404, errEnvelope('not-found')))
    const r = await client().preview('t')
    assert.equal(isErr(r) && r.error === 'autocadastro-invalid', true)
  })

  it('shape inválido (drift de contrato) → err(server)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(200, { collaboratorId: 'c1' }))
    const r = await client().preview('t')
    assert.equal(isErr(r) && r.error === 'server', true)
  })

  it('rede fora → err(connectivity)', async () => {
    globalThis.fetch = () => Promise.reject(new Error('boom'))
    const r = await client().preview('t')
    assert.equal(isErr(r) && r.error === 'connectivity', true)
  })
})

describe('submit (POST)', () => {
  it('200 → ok', async () => {
    globalThis.fetch = () => Promise.resolve(new Response(null, { status: 200 }))
    const r = await client().submit(submitInput)
    assert.equal(isOk(r), true)
  })

  it('400 collaborator-autocadastro-cpf-mismatch → err(autocadastro-cpf-mismatch)', async () => {
    globalThis.fetch = () =>
      Promise.resolve(jsonResponse(400, errEnvelope('collaborator-autocadastro-cpf-mismatch')))
    const r = await client().submit(submitInput)
    assert.equal(isErr(r) && r.error === 'autocadastro-cpf-mismatch', true)
  })

  it('400 outro slug → err(validation)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(400, errEnvelope('some-validation-error')))
    const r = await client().submit(submitInput)
    assert.equal(isErr(r) && r.error === 'validation', true)
  })

  it('404 (token expirado/usado) → err(autocadastro-invalid)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(404, errEnvelope('not-found')))
    const r = await client().submit(submitInput)
    assert.equal(isErr(r) && r.error === 'autocadastro-invalid', true)
  })

  it('5xx → err(server)', async () => {
    globalThis.fetch = () => Promise.resolve(jsonResponse(500, errEnvelope('internal')))
    const r = await client().submit(submitInput)
    assert.equal(isErr(r) && r.error === 'server', true)
  })

  it('rede fora → err(connectivity)', async () => {
    globalThis.fetch = () => Promise.reject(new Error('boom'))
    const r = await client().submit(submitInput)
    assert.equal(isErr(r) && r.error === 'connectivity', true)
  })
})
