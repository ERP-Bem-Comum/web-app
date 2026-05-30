/**
 * get-me — retorna a identidade do usuário (R3: só { userId }) a partir do access token.
 * Thin sobre o client do core-api; existe como use-case p/ o ponto de orquestração (e crescer no futuro).
 */
import type { Result } from '../../../../shared/primitives/result.ts'
import type { AuthUser } from '../domain/session.types.ts'
import type { AuthError } from '../domain/auth.errors.ts'

type Deps = Readonly<{
  client: Readonly<{ me: (accessToken: string) => Promise<Result<AuthUser, AuthError>> }>
}>

export const createGetMe =
  (deps: Deps) =>
  (accessToken: string): Promise<Result<AuthUser, AuthError>> =>
    deps.client.me(accessToken)
