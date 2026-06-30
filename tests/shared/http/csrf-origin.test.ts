/**
 * CSRF de origem (FR-014) — valida `Sec-Fetch-Site`/`Origin` vs `Host` em mutações.
 * Complementa o SameSite=Strict do cookie. TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { isSameOriginRequest } from '#shared/http/csrf-origin.ts'

describe('isSameOriginRequest', () => {
  it('Sec-Fetch-Site: same-origin → true', () => {
    assert.equal(isSameOriginRequest({ secFetchSite: 'same-origin' }), true)
  })
  it('Sec-Fetch-Site: cross-site → false', () => {
    assert.equal(isSameOriginRequest({ secFetchSite: 'cross-site' }), false)
  })
  it('Origin combina com Host → true', () => {
    assert.equal(isSameOriginRequest({ origin: 'https://app.localhost', host: 'app.localhost' }), true)
  })
  it('Origin difere do Host → false', () => {
    assert.equal(isSameOriginRequest({ origin: 'https://evil.com', host: 'app.localhost' }), false)
  })
  it('sem sinais → false (conservador)', () => {
    assert.equal(isSameOriginRequest({}), false)
  })
})
