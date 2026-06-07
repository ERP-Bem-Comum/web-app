/**
 * safeRedirect — só aceita caminho interno relativo (anti open-redirect, FR-005). TDD.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { safeRedirect } from '#modules/auth/client/data/helpers/safe-redirect.ts'

describe('safeRedirect', () => {
  it('caminho interno → mantém', () => {
    assert.equal(safeRedirect('/contratos'), '/contratos')
  })
  it('undefined/vazio → fallback "/"', () => {
    assert.equal(safeRedirect(undefined), '/')
    assert.equal(safeRedirect(''), '/')
  })
  it('protocol-relative (//) → fallback (anti open-redirect)', () => {
    assert.equal(safeRedirect('//evil.com'), '/')
  })
  it('URL absoluta externa → fallback', () => {
    assert.equal(safeRedirect('https://evil.com'), '/')
    assert.equal(safeRedirect('http://x'), '/')
  })
  it('não começa com "/" → fallback', () => {
    assert.equal(safeRedirect('contratos'), '/')
  })
  it('respeita fallback custom', () => {
    assert.equal(safeRedirect(undefined, '/home'), '/home')
  })
})
