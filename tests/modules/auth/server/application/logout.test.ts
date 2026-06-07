/**
 * logout use-case — revoga o refresh no core-api (best-effort) e SEMPRE apaga a sessão local (FR-011). TDD.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createLogout } from '#modules/auth/server/application/commands/logout.use-case.ts'
import { ok, err, isOk, type Result } from '#shared/primitives/result.ts'
import type { SessionId } from '#modules/auth/server/domain/session/session.types.ts'
import type { AuthError } from '#modules/auth/server/domain/errors/auth.errors.ts'

const SID = 's1' as SessionId

const setup = (logout: () => Promise<Result<void, AuthError>>) => {
  const deleted: string[] = []
  const run = createLogout({
    client: { logout },
    store: {
      delete: (id) => {
        deleted.push(id)
        return Promise.resolve()
      },
    },
  })
  return { deleted, run }
}

describe('logout use-case', () => {
  it('sucesso remoto → revoga + apaga sessão local', async () => {
    const { deleted, run } = setup(() => Promise.resolve(ok(undefined)))
    const r = await run(SID, 'r1')
    assert.equal(isOk(r), true)
    assert.deepEqual(deleted, ['s1'])
  })

  it('falha remota → AINDA apaga a sessão local (FR-011)', async () => {
    const { deleted, run } = setup(() => Promise.resolve(err('server')))
    const r = await run(SID, 'r1')
    assert.equal(isOk(r), true)
    assert.deepEqual(deleted, ['s1'])
  })
})
