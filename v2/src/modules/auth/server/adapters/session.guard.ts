/**
 * session.guard — resolve uma sessão a partir do `sessionId` (lido do cookie pela server fn):
 * busca no store; se o access ainda é válido devolve a sessão; se expirou, dispara o **refresh
 * silencioso single-flight** (injetado). Sem sessão / refresh falho → erro (a server fn limpa o cookie).
 * `refreshSession` é injetado (port-like) p/ testabilidade — a composição (server fn) wira o use-case.
 */
import { ok, err, isErr, type Result } from '../../../../shared/primitives/result.ts'
import type { SessionStore } from '../../../../shared/ports/session-store.port.ts'
import type { Session, SessionId } from '../domain/session.types.ts'
import type { AuthError } from '../domain/auth.errors.ts'

type Deps = Readonly<{
  store: SessionStore<Session>
  refreshSession: (sessionId: SessionId, session: Session) => Promise<Result<Session, AuthError>>
  now: () => number
}>

export const createResolveSession =
  (deps: Deps) =>
  async (sessionId: SessionId): Promise<Result<Session, AuthError>> => {
    const got = await deps.store.get(sessionId)
    if (isErr(got)) return err('session-not-found')

    const session = got.value
    if (deps.now() < session.accessExpiresAt) return ok(session)

    // access expirado → renovação silenciosa (single-flight no use-case)
    return deps.refreshSession(sessionId, session)
  }
