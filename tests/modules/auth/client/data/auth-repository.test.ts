/**
 * auth.repository (porta client) — injeta a server fn (loginFn); converte LoginFnResult → Result.
 * Injeção torna a porta testável sem o runtime do framework. TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createAuthRepository } from '#modules/auth/client/data/repository/auth.repository.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'
import type { LoginFnResult } from '#modules/auth/server/adapters/server-fns/login.server-fn.ts'
import type { RequestPasswordResetFnResult } from '#modules/auth/server/adapters/server-fns/request-password-reset.server-fn.ts'
import type { LoginInput, ForgotPasswordInput } from '#modules/auth/client/data/model/auth.model.ts'

const input: LoginInput = { email: 'a@b.com', password: 'p', rememberDevice: false }

// Stub padrão do reset (o login não o exercita; presença satisfaz a assinatura da porta).
const noopReset = (_o: { data: ForgotPasswordInput }): Promise<RequestPasswordResetFnResult> =>
  Promise.resolve({ ok: true })

describe('auth.repository.login', () => {
  it('sucesso → ok(CurrentUser)', async () => {
    const loginFn = (_o: { data: LoginInput }): Promise<LoginFnResult> =>
      Promise.resolve({ ok: true, userId: 'u' })
    const r = await createAuthRepository({ loginFn, requestPasswordResetFn: noopReset }).login(input)
    assert.equal(isOk(r) && r.value.userId === 'u', true)
  })

  it('falha de auth → err(LoginFailure com code)', async () => {
    const loginFn = (_o: { data: LoginInput }): Promise<LoginFnResult> =>
      Promise.resolve({ ok: false, error: 'invalid-credentials' })
    const r = await createAuthRepository({ loginFn, requestPasswordResetFn: noopReset }).login(input)
    assert.equal(isErr(r) && r.error.code === 'invalid-credentials', true)
    assert.equal(isErr(r) && r.error.reference === undefined, true)
  })

  it('erro server com reference → propaga code + reference (FR-024)', async () => {
    const loginFn = (_o: { data: LoginInput }): Promise<LoginFnResult> =>
      Promise.resolve({ ok: false, error: 'server', reference: 'req-xyz' })
    const r = await createAuthRepository({ loginFn, requestPasswordResetFn: noopReset }).login(input)
    assert.equal(isErr(r) && r.error.code === 'server' && r.error.reference === 'req-xyz', true)
  })
})

describe('auth.repository.requestPasswordReset (#037 — anti-enumeração)', () => {
  const loginFn = (_o: { data: LoginInput }): Promise<LoginFnResult> =>
    Promise.resolve({ ok: true, userId: 'u' })
  const forgot: ForgotPasswordInput = { email: 'a@b.com' }

  it('202 (ok) → ok(void) — sucesso uniforme, sem revelar se o e-mail existe', async () => {
    const requestPasswordResetFn = (_o: {
      data: ForgotPasswordInput
    }): Promise<RequestPasswordResetFnResult> => Promise.resolve({ ok: true })
    const r = await createAuthRepository({ loginFn, requestPasswordResetFn }).requestPasswordReset(forgot)
    assert.equal(isOk(r), true)
  })

  it('falha de transporte/servidor → err(code)', async () => {
    const requestPasswordResetFn = (_o: {
      data: ForgotPasswordInput
    }): Promise<RequestPasswordResetFnResult> => Promise.resolve({ ok: false, error: 'connectivity' })
    const r = await createAuthRepository({ loginFn, requestPasswordResetFn }).requestPasswordReset(forgot)
    assert.equal(isErr(r) && r.error.code === 'connectivity', true)
  })
})
