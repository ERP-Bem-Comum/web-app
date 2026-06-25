/**
 * loginViewModel (node:test) — núcleo AGNÓSTICO do login (ADR-0009): derivação pura de erro
 * (`toErrorTag`) + efeito de sucesso (`onSuccess` emite `UsuarioAutenticado`). Sem React. TDD.
 * (Absorve os casos do antigo `client/usecase/login`, removido nesta feature.)
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { ok, err } from '#shared/primitives/result.ts'
import { loginViewModel } from '#modules/auth/client/login/viewModel/login.view-model.ts'
import type { AuthEvent } from '#modules/auth/client/data/events/auth.events.ts'

describe('loginViewModel', () => {
  it('toErrorTag: invalid-credentials → tag de credencial inválida', () => {
    assert.equal(loginViewModel.toErrorTag('invalid-credentials'), 'auth.error.invalid-credentials')
  })

  it('toErrorTag: erro de sessão/refresh → tag genérica', () => {
    assert.equal(loginViewModel.toErrorTag('server'), 'auth.error.unexpected')
  })

  it('unexpectedErrorTag: erro LANÇADO (rede/env/server) → tag genérica (não silencia a UI)', () => {
    assert.equal(loginViewModel.unexpectedErrorTag, 'auth.error.unexpected')
  })

  it('onSuccess (ok): emite UsuarioAutenticado com o userId', () => {
    const events: AuthEvent[] = []
    loginViewModel.onSuccess(ok({ userId: 'u' }), { emit: (e) => events.push(e) })
    assert.deepEqual(events, [{ type: 'UsuarioAutenticado', userId: 'u' }])
  })

  it('onSuccess (err): NÃO emite evento', () => {
    const events: AuthEvent[] = []
    loginViewModel.onSuccess(err({ code: 'invalid-credentials' }), { emit: (e) => events.push(e) })
    assert.equal(events.length, 0)
  })
})
