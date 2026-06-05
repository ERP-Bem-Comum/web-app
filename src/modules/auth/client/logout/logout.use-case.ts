/**
 * client/usecase/logout — intenção de UI: encerra a sessão (via porta) e emite o fato `SessaoEncerrada`
 * no bus (§XII) → quem reage (ex.: use-current-user) invalida o `me`. `requestLogout`/`emit` injetados.
 */
import type { AuthEvent } from '#modules/auth/client/data/events/auth.events.ts'

type Deps = Readonly<{
  requestLogout: () => Promise<void>
  emit: (event: AuthEvent) => void
}>

export const createLogoutUseCase =
  (deps: Deps) =>
  async (): Promise<void> => {
    await deps.requestLogout()
    deps.emit({ type: 'SessaoEncerrada' })
  }
