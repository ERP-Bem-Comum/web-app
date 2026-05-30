/**
 * auth.repository (porta client) — injeta a server fn (loginFn); converte LoginFnResult → Result.
 * Injeção torna a porta testável sem o runtime do framework. TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createAuthRepository } from '#modules/auth/client/data/repository/auth.repository.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'
import type { LoginFnResult } from '#modules/auth/server/adapters/server-fns/login.server-fn.ts'
import type { LoginInput } from '#modules/auth/client/data/model/auth.model.ts'

const input: LoginInput = { email: 'a@b.com', password: 'p', rememberDevice: false }

describe('auth.repository.login', () => {
  it('sucesso → ok(CurrentUser)', async () => {
    const loginFn = (_o: { data: LoginInput }): Promise<LoginFnResult> =>
      Promise.resolve({ ok: true, userId: 'u' })
    const r = await createAuthRepository({ loginFn }).login(input)
    assert.equal(isOk(r) && r.value.userId === 'u', true)
  })

  it('falha de auth → err(AuthError)', async () => {
    const loginFn = (_o: { data: LoginInput }): Promise<LoginFnResult> =>
      Promise.resolve({ ok: false, error: 'invalid-credentials' })
    const r = await createAuthRepository({ loginFn }).login(input)
    assert.equal(isErr(r) && r.error === 'invalid-credentials', true)
  })
})
