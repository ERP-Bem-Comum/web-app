/**
 * Security headers + CSP (builder puro). FR-001/002/003.
 * CSP estrita: SEM `unsafe-inline` em script-src (R2 — script-src 'self'); HSTS só em https.
 * TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  serializeCsp,
  buildSecurityHeaders,
  isHttpsFromForwardedProto,
  CSP_BASELINE,
} from '#shared/http/security-headers.ts'

describe('isHttpsFromForwardedProto (trust-proxy — R1)', () => {
  it("'https' → true", () => {
    assert.equal(isHttpsFromForwardedProto('https'), true)
  })
  it("'http' → false", () => {
    assert.equal(isHttpsFromForwardedProto('http'), false)
  })
  it('ausente (dev puro) → false', () => {
    assert.equal(isHttpsFromForwardedProto(undefined), false)
    assert.equal(isHttpsFromForwardedProto(null), false)
  })
})

describe('serializeCsp', () => {
  it('serializa diretivas em string determinística "k v v; k2 v2"', () => {
    const s = serializeCsp({ 'default-src': ["'self'"], 'img-src': ["'self'", 'data:'] })
    assert.equal(s, "default-src 'self'; img-src 'self' data:")
  })

  it('CSP baseline NÃO contém unsafe-inline em script-src', () => {
    const s = serializeCsp(CSP_BASELINE)
    const scriptDirective = s.split('; ').find((d) => d.startsWith('script-src '))
    assert.ok(scriptDirective, 'script-src presente')
    assert.equal(scriptDirective.includes('unsafe-inline'), false)
    assert.equal(scriptDirective.includes('unsafe-eval'), false)
  })

  it('CSP baseline inclui frame-ancestors none, object-src none, base-uri self', () => {
    const s = serializeCsp(CSP_BASELINE)
    assert.match(s, /frame-ancestors 'none'/)
    assert.match(s, /object-src 'none'/)
    assert.match(s, /base-uri 'self'/)
  })
})

describe('buildSecurityHeaders', () => {
  const find = (set: readonly (readonly [string, string])[], name: string): string | undefined =>
    set.find(([n]) => n.toLowerCase() === name.toLowerCase())?.[1]

  it('sempre inclui nosniff, X-Frame-Options DENY e Referrer-Policy', () => {
    const set = buildSecurityHeaders({ https: false })
    assert.equal(find(set, 'X-Content-Type-Options'), 'nosniff')
    assert.equal(find(set, 'X-Frame-Options'), 'DENY')
    assert.equal(find(set, 'Referrer-Policy'), 'strict-origin-when-cross-origin')
  })

  it('sempre inclui Content-Security-Policy sem unsafe-inline em script-src', () => {
    const set = buildSecurityHeaders({ https: true })
    const csp = find(set, 'Content-Security-Policy')
    assert.ok(csp, 'CSP presente')
    const scriptDirective = csp.split('; ').find((d) => d.startsWith('script-src '))
    assert.equal(scriptDirective?.includes('unsafe-inline'), false)
  })

  it('https:true → inclui Strict-Transport-Security', () => {
    const set = buildSecurityHeaders({ https: true })
    const hsts = find(set, 'Strict-Transport-Security')
    assert.ok(hsts, 'HSTS presente em https')
    assert.match(hsts, /max-age=\d+/)
    assert.match(hsts, /includeSubDomains/)
  })

  it('https:false (dev http) → OMITE Strict-Transport-Security', () => {
    const set = buildSecurityHeaders({ https: false })
    assert.equal(find(set, 'Strict-Transport-Security'), undefined)
  })

  it('aceita CSP customizada via opts.csp', () => {
    const set = buildSecurityHeaders({ https: false, csp: "default-src 'none'" })
    assert.equal(find(set, 'Content-Security-Policy'), "default-src 'none'")
  })
})
