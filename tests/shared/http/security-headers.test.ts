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
  cspWithScriptNonce,
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

  it('CSP baseline libera frame-src self + blob (preview de PDF), sem abrir p/ http(s) externo', () => {
    const s = serializeCsp(CSP_BASELINE)
    const frameSrc = s.split('; ').find((d) => d.startsWith('frame-src '))
    assert.ok(frameSrc, 'frame-src presente')
    assert.match(frameSrc, /frame-src 'self' blob:/)
    assert.equal(frameSrc.includes('http://'), false)
    assert.equal(frameSrc.includes('https://'), false)
    assert.equal(frameSrc.includes('*'), false)
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

  it('com nonce → script-src ganha \'nonce-X\' (mantém \'self\')', () => {
    const set = buildSecurityHeaders({ https: false, nonce: 'abc123' })
    const csp = find(set, 'Content-Security-Policy')
    assert.ok(csp, 'CSP presente')
    const scriptDirective = csp.split('; ').find((d) => d.startsWith('script-src '))
    assert.ok(scriptDirective?.includes("'self'"), "script-src mantém 'self'")
    assert.ok(scriptDirective?.includes("'nonce-abc123'"), "script-src ganha o nonce")
  })

  it('com nonce → style-src NÃO ganha nonce (preserva unsafe-inline; regra CSP3)', () => {
    const set = buildSecurityHeaders({ https: false, nonce: 'abc123' })
    const csp = find(set, 'Content-Security-Policy')
    const styleDirective = csp?.split('; ').find((d) => d.startsWith('style-src '))
    assert.ok(styleDirective?.includes("'unsafe-inline'"), "style-src mantém 'unsafe-inline'")
    assert.equal(styleDirective?.includes('nonce-'), false, 'style-src sem nonce')
  })

  it('sem nonce → script-src permanece só \'self\' (sem nonce-)', () => {
    const set = buildSecurityHeaders({ https: false })
    const csp = find(set, 'Content-Security-Policy')
    const scriptDirective = csp?.split('; ').find((d) => d.startsWith('script-src '))
    assert.equal(scriptDirective?.includes('nonce-'), false)
  })
})

describe('cspWithScriptNonce (puro)', () => {
  it('adiciona \'nonce-X\' ao script-src sem mutar o original', () => {
    const out = cspWithScriptNonce(CSP_BASELINE, 'n0nc3')
    assert.deepEqual(out['script-src'], ["'self'", "'nonce-n0nc3'"])
    // imutabilidade: o baseline original não muda
    assert.deepEqual(CSP_BASELINE['script-src'], ["'self'"])
  })

  it('preserva as demais diretivas intactas', () => {
    const out = cspWithScriptNonce(CSP_BASELINE, 'n0nc3')
    assert.deepEqual(out['style-src'], CSP_BASELINE['style-src'])
    assert.deepEqual(out['default-src'], CSP_BASELINE['default-src'])
  })
})
