/**
 * client/usecase/revoke-all-sessions — intenção de UI: encerra TODAS as sessões do usuário (todos os
 * dispositivos, incluindo o atual) via porta, e emite o fato `SessaoEncerrada` no bus (§XII). Como a
 * sessão atual também morre, o app reage exatamente como no logout (invalida `me`, redireciona ao login).
 * Mesmo shape do `logout.use-case`. `requestRevokeAllSessions`/`emit` injetados.
 */
import type { AuthEvent } from '#modules/auth/client/data/events/auth.events.ts'

type Deps = Readonly<{
  requestRevokeAllSessions: () => Promise<void>
  emit: (event: AuthEvent) => void
}>

export const createRevokeAllSessionsUseCase = (deps: Deps) => async (): Promise<void> => {
  await deps.requestRevokeAllSessions()
  deps.emit({ type: 'SessaoEncerrada' })
}
