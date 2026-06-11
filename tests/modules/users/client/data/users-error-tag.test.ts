/**
 * usersErrorTag (#32) — mapeia o novo erro de política de senha para tag i18n amigável.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { usersErrorTag } from '../../../../../src/modules/users/client/data/helpers/users-error-tag.ts'

describe('usersErrorTag', () => {
  it('password-too-short → users.error.password-too-short', () => {
    assert.equal(usersErrorTag('password-too-short'), 'users.error.password-too-short')
  })

  it('password-weak → users.error.password-weak (inalterado)', () => {
    assert.equal(usersErrorTag('password-weak'), 'users.error.password-weak')
  })
})
