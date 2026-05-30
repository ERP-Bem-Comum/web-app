/**
 * Composição do use-case de logout (client) — wira a porta (gateway → server fn) + o bus.
 */
import { requestLogout } from '#modules/auth/client/data/gateways/logout.gateway.ts'
import { authBus } from '#modules/auth/client/data/events/auth.bus.ts'
import type { AuthEvent } from '#modules/auth/client/data/events/auth.events.ts'
import { createLogoutUseCase } from './logout.use-case.ts'

export const logoutUseCase = createLogoutUseCase({
  requestLogout,
  emit: (event: AuthEvent) => {
    authBus.emit(event)
  },
})
