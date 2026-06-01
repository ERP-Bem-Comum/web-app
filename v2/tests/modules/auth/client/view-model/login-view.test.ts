/**
 * deriveLoginView (BDD) — lógica pura do ViewModel: idle → submitting → error (com tag). TDD.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { deriveLoginView } from '#modules/auth/client/login/login.view-model.ts'
import { ok, err } from '#shared/primitives/result.ts'

describe('deriveLoginView', () => {
  it('Given mutation em andamento, Then status = submitting', () => {
    assert.deepEqual(deriveLoginView({ isPending: true }), { status: 'submitting', errorTag: null })
  })

  it('Given sem submit ainda, Then status = idle', () => {
    assert.deepEqual(deriveLoginView({ isPending: false }), { status: 'idle', errorTag: null })
  })

  it('Given resultado de erro, Then status = error com a tag mapeada', () => {
    assert.deepEqual(deriveLoginView({ isPending: false, data: err('invalid-credentials') }), {
      status: 'error',
      errorTag: 'auth.error.invalid-credentials',
    })
  })

  it('Given resultado ok, Then status = idle (sucesso → o hook navega)', () => {
    assert.deepEqual(deriveLoginView({ isPending: false, data: ok({ userId: 'u' }) }), {
      status: 'idle',
      errorTag: null,
    })
  })
})
