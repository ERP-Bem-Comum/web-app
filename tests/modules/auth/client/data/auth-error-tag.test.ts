/**
 * authErrorTag — AuthError → tag i18n (§XI: sem literais). TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { authErrorTag } from '#modules/auth/client/data/helpers/auth-error-tag.ts'

describe('authErrorTag', () => {
  it('invalid-credentials → tag específica', () => {
    assert.equal(authErrorTag('invalid-credentials'), 'auth.error.invalid-credentials')
  })
  it('user-disabled → tag específica', () => {
    assert.equal(authErrorTag('user-disabled'), 'auth.error.user-disabled')
  })
  it('connectivity → tag de conectividade', () => {
    assert.equal(authErrorTag('connectivity'), 'auth.error.connectivity')
  })
  it('rate-limited (429) → tag de muitas tentativas', () => {
    assert.equal(authErrorTag('rate-limited'), 'auth.error.rate-limited')
  })
  it('erro inesperado (ex.: refresh-rotated no login) → tag genérica', () => {
    assert.equal(authErrorTag('refresh-rotated'), 'auth.error.unexpected')
  })
})
