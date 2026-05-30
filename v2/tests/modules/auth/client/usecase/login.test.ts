/**
 * client/usecase/login — orquestra o repository e emite `UsuarioAutenticado` no sucesso. TDD.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createLoginUseCase } from '#modules/auth/client/usecase/login/login.use-case.ts'
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { AuthRepository, AuthError } from '#modules/auth/client/data/repository/auth.repository.ts'
import type { CurrentUser } from '#modules/auth/client/data/model/auth.model.ts'
import type { AuthEvent } from '#modules/auth/client/data/events/auth.events.ts'

const repoWith = (r: Result<CurrentUser, AuthError>): AuthRepository => ({ login: () => Promise.resolve(r) })

describe('client/usecase/login', () => {
  it('sucesso → emite UsuarioAutenticado e devolve ok', async () => {
    const events: AuthEvent[] = []
    const run = createLoginUseCase({ repo: repoWith(ok({ userId: 'u' })), emit: (e) => events.push(e) })

    const r = await run({ email: 'a@b.com', password: 'p', rememberDevice: false })

    assert.equal(r.ok, true)
    assert.deepEqual(events, [{ type: 'UsuarioAutenticado', userId: 'u' }])
  })

  it('falha → NÃO emite evento', async () => {
    const events: AuthEvent[] = []
    const run = createLoginUseCase({ repo: repoWith(err('invalid-credentials')), emit: (e) => events.push(e) })

    await run({ email: 'a@b.com', password: 'x', rememberDevice: false })

    assert.equal(events.length, 0)
  })
})
