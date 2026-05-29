/**
 * Testes de `mapToServerResponse` — HttpError → Response preservando status upstream.
 * Fonte: specs/001-v2-foundation/contracts/error-envelope.md.
 * TDD: escrito ANTES da implementação.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { mapToServerResponse } from '../../../src/external/core-api/map-to-server-response.ts'

describe('mapToServerResponse — preserva status', () => {
  it('http 404 → Response 404 com o body original', async () => {
    const res = mapToServerResponse({ kind: 'http', status: 404, body: { error: { code: 'not-found' } } })

    assert.equal(res.status, 404)
    assert.equal(await res.text(), JSON.stringify({ error: { code: 'not-found' } }))
  })

  it('http 409 → Response 409', () => {
    assert.equal(mapToServerResponse({ kind: 'http', status: 409, body: null }).status, 409)
  })

  it('network → 504 connectivity', async () => {
    const res = mapToServerResponse({ kind: 'network' })
    assert.equal(res.status, 504)
    assert.deepEqual(JSON.parse(await res.text()), { kind: 'connectivity' })
  })

  it('timeout → 504', () => {
    assert.equal(mapToServerResponse({ kind: 'timeout' }).status, 504)
  })

  it('parse → 502 bad-gateway', async () => {
    const res = mapToServerResponse({ kind: 'parse' })
    assert.equal(res.status, 502)
    assert.deepEqual(JSON.parse(await res.text()), { kind: 'bad-gateway' })
  })

  it('aborted → 499 sem corpo', async () => {
    const res = mapToServerResponse({ kind: 'aborted' })
    assert.equal(res.status, 499)
    assert.equal(await res.text(), '')
  })
})
