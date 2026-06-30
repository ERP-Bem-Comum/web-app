/**
 * logout use-case — revoga o refresh no core-api (best-effort) e SEMPRE apaga a sessão local.
 * FR-011: não deixar o usuário "preso logado" no cliente se a revogação remota falhar. Sempre `ok`.
 */
import { ok, type Result } from '#shared/primitives/result.ts'
import type { SessionStore } from '#shared/ports/session-store.port.ts'
import type { Session, SessionId } from '#modules/auth/server/domain/session/session.types.ts'
import type { AuthError } from '#modules/auth/server/domain/errors/auth.errors.ts'

type Deps = Readonly<{
  client: Readonly<{ logout: (refreshToken: string) => Promise<Result<void, AuthError>> }>
  store: Pick<SessionStore<Session>, 'delete'>
}>

export const createLogout =
  (deps: Deps) =>
  async (sessionId: SessionId, refreshToken: string): Promise<Result<void, never>> => {
    await deps.client.logout(refreshToken) // best-effort: revogação remota; resultado ignorado de propósito
    await deps.store.delete(sessionId) // autoridade local: sempre encerra a sessão
    return ok(undefined)
  }
