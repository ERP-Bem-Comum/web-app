/**
 * Testes de `resultFetch` — fetch → Result<T, HttpError>, NUNCA lança.
 * Stub de globalThis.fetch por cenário. Cobre 2xx/4xx/5xx/204/parse/network/abort/timeout.
 * TDD: escrito ANTES da implementação.
 */
import { describe, it, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'

import { resultFetch } from '#external/core-api/result-fetch.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

describe('resultFetch — sucesso', () => {
  it('200 JSON → ok(corpo parseado)', async () => {
    globalThis.fetch = () => Promise.resolve(new Response(JSON.stringify({ id: 1 }), { status: 200 }))

    const r = await resultFetch<{ id: number }>('http://x/r')

    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(r.value.id, 1)
  })

  it('204 → ok(undefined)', async () => {
    globalThis.fetch = () => Promise.resolve(new Response(null, { status: 204 }))

    const r = await resultFetch('http://x/r')

    assert.equal(isOk(r), true)
    if (isOk(r)) assert.equal(r.value, undefined)
  })
})

describe('resultFetch — erros HTTP (sem lançar)', () => {
  it('404 → err(http 404) com body', async () => {
    const body = { error: { code: 'not-found', message: 'not-found', requestId: 'r1' } }
    globalThis.fetch = () => Promise.resolve(new Response(JSON.stringify(body), { status: 404 }))

    const r = await resultFetch('http://x/r')

    assert.equal(isErr(r), true)
    if (isErr(r) && r.error.kind === 'http') {
      assert.equal(r.error.status, 404)
      assert.deepEqual(r.error.body, body)
    } else {
      assert.fail('esperado err http 404')
    }
  })

  it('500 → err(http 500)', async () => {
    globalThis.fetch = () => Promise.resolve(new Response('boom', { status: 500 }))

    const r = await resultFetch('http://x/r')

    assert.equal(isErr(r) && r.error.kind === 'http' && r.error.status === 500, true)
  })

  it('200 com corpo inválido → err(parse)', async () => {
    globalThis.fetch = () => Promise.resolve(new Response('<<<not json>>>', { status: 200 }))

    const r = await resultFetch('http://x/r')

    assert.equal(isErr(r) && r.error.kind === 'parse', true)
  })
})

describe('resultFetch — transporte', () => {
  it('fetch rejeita → err(network)', async () => {
    globalThis.fetch = () => Promise.reject(new TypeError('conn refused'))

    const r = await resultFetch('http://x/r')

    assert.equal(isErr(r) && r.error.kind === 'network', true)
  })

  it('signal já abortado → err(aborted)', async () => {
    globalThis.fetch = (_url, init) =>
      init?.signal?.aborted === true
        ? Promise.reject(new DOMException('aborted', 'AbortError'))
        : Promise.resolve(new Response('{}', { status: 200 }))

    const r = await resultFetch('http://x/r', { signal: AbortSignal.abort() })

    assert.equal(isErr(r) && r.error.kind === 'aborted', true)
  })

  it('timeout (sem signal externo) → err(timeout)', async () => {
    globalThis.fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('timeout', 'AbortError'))
        })
      })

    const r = await resultFetch('http://x/r', { timeoutMs: 5 })

    assert.equal(isErr(r) && r.error.kind === 'timeout', true)
  })
})
