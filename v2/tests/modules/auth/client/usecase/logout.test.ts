/**
 * client/usecase/logout — chama o requestLogout (porta → server fn) e emite `SessaoEncerrada`. TDD.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createLogoutUseCase } from '#modules/auth/client/usecase/logout/logout.use-case.ts'
import type { AuthEvent } from '#modules/auth/client/data/events/auth.events.ts'

describe('client/usecase/logout', () => {
  it('chama requestLogout e emite SessaoEncerrada', async () => {
    let logoutCalls = 0
    const events: AuthEvent[] = []
    const run = createLogoutUseCase({
      requestLogout: () => {
        logoutCalls += 1
        return Promise.resolve()
      },
      emit: (e) => events.push(e),
    })

    await run()

    assert.equal(logoutCalls, 1)
    assert.deepEqual(events, [{ type: 'SessaoEncerrada' }])
  })
})
