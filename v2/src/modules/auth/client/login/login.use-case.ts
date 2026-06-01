/**
 * client/usecase/login — intenção de UI: faz o login via repository (porta) e, no sucesso, emite o fato
 * `UsuarioAutenticado` no bus (§XII) para quem reage (ex.: invalidar a query `me`). `emit` injetado.
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import type { AuthRepository, AuthError } from '#modules/auth/client/data/repository/auth.repository.ts'
import type { LoginInput, CurrentUser } from '#modules/auth/client/data/model/auth.model.ts'
import type { AuthEvent } from '#modules/auth/client/data/events/auth.events.ts'

type Deps = Readonly<{
  repo: AuthRepository
  emit: (event: AuthEvent) => void
}>

export const createLoginUseCase =
  (deps: Deps) =>
  async (input: LoginInput): Promise<Result<CurrentUser, AuthError>> => {
    const r = await deps.repo.login(input)
    if (isOk(r)) deps.emit({ type: 'UsuarioAutenticado', userId: r.value.userId })
    return r
  }
