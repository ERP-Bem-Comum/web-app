/**
 * revoke-all-sessions use-case (client) — chama a porta e emite `SessaoEncerrada` no bus (§XII), na
 * ordem certa (revoga antes de emitir). Espelha o contrato do logout use-case. node:test (lógica pura).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createRevokeAllSessionsUseCase } from '#modules/auth/client/revoke-all-sessions/revoke-all-sessions.use-case.ts'
import type { AuthEvent } from '#modules/auth/client/data/events/auth.events.ts'

describe('revoke-all-sessions use-case', () => {
  it('chama a porta e emite SessaoEncerrada', async () => {
    const emitted: AuthEvent[] = []
    let requested = 0
    const run = createRevokeAllSessionsUseCase({
      requestRevokeAllSessions: () => {
        requested += 1
        return Promise.resolve()
      },
      emit: (e) => {
        emitted.push(e)
      },
    })

    await run()

    assert.equal(requested, 1)
    assert.deepEqual(emitted, [{ type: 'SessaoEncerrada' }])
  })

  it('revoga ANTES de emitir o evento', async () => {
    const order: string[] = []
    const run = createRevokeAllSessionsUseCase({
      requestRevokeAllSessions: () => {
        order.push('request')
        return Promise.resolve()
      },
      emit: () => {
        order.push('emit')
      },
    })

    await run()

    assert.deepEqual(order, ['request', 'emit'])
  })
})
