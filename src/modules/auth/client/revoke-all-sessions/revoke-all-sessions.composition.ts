/**
 * Composição do use-case de "encerrar todas as sessões" (client) — wira a porta (gateway → server fn) +
 * o bus. Espelha `logout.composition`.
 */
import { requestRevokeAllSessions } from '#modules/auth/client/data/gateways/revoke-all-sessions.gateway.ts'
import { authBus } from '#modules/auth/client/data/events/auth.bus.ts'
import type { AuthEvent } from '#modules/auth/client/data/events/auth.events.ts'
import { createRevokeAllSessionsUseCase } from './revoke-all-sessions.use-case.ts'

export const revokeAllSessionsUseCase = createRevokeAllSessionsUseCase({
  requestRevokeAllSessions,
  emit: (event: AuthEvent) => {
    authBus.emit(event)
  },
})
