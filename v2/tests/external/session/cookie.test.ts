/**
 * Cookie de sessão (builder puro). `__Host-session` opaco; HttpOnly/SameSite=Strict/Secure/Path=/;
 * Max-Age só se persistent ("lembrar este dispositivo"). TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  SESSION_COOKIE_NAME,
  buildSessionCookie,
  serializeCookie,
} from '#external/session/cookie.ts'

describe('buildSessionCookie', () => {
  it('atributos seguros + nome __Host-session', () => {
    const c = buildSessionCookie('sid-1', { persistent: false, maxAgeSeconds: 0 })
    assert.equal(c.name, SESSION_COOKIE_NAME)
    assert.equal(c.value, 'sid-1')
    assert.equal(c.httpOnly, true)
    assert.equal(c.secure, true)
    assert.equal(c.sameSite, 'Strict')
    assert.equal(c.path, '/')
  })

  it('cookie de sessão (não persistente) NÃO tem maxAge', () => {
    const c = buildSessionCookie('sid-1', { persistent: false, maxAgeSeconds: 999 })
    assert.equal(c.maxAge, undefined)
  })

  it('persistente → maxAge presente', () => {
    const c = buildSessionCookie('sid-1', { persistent: true, maxAgeSeconds: 3600 })
    assert.equal(c.maxAge, 3600)
  })
})

describe('serializeCookie', () => {
  it('serializa para header Set-Cookie com flags', () => {
    const s = serializeCookie(buildSessionCookie('sid-1', { persistent: true, maxAgeSeconds: 60 }))
    assert.match(s, /^__Host-session=sid-1;/)
    assert.match(s, /HttpOnly/)
    assert.match(s, /Secure/)
    assert.match(s, /SameSite=Strict/)
    assert.match(s, /Path=\//)
    assert.match(s, /Max-Age=60/)
  })

  it('sem Max-Age quando cookie de sessão', () => {
    const s = serializeCookie(buildSessionCookie('sid-1', { persistent: false, maxAgeSeconds: 0 }))
    assert.equal(s.includes('Max-Age'), false)
  })
})
