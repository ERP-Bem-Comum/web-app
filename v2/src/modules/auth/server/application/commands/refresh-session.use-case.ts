/**
 * refresh-session — renova a sessão (rotaciona o refresh) com SINGLE-FLIGHT por sessionId.
 * CRÍTICO (R2): o core-api rotaciona o refresh a cada uso e tem reuse-detection — 2 refreshes
 * concorrentes com o mesmo token fariam o 2º parecer replay → revoga a cadeia. O single-flight
 * (promessa em voo por sessionId) garante UMA renovação. Em falha (rotated/revoked/expired) → mata a sessão.
 */
import { ok, err, isErr, type Result } from '#shared/primitives/result.ts'
import type { SessionStore } from '#shared/ports/session-store.port.ts'
import type { Session, SessionId, AuthTokens } from '#modules/auth/server/domain/session/session.types.ts'
import { buildSession, REFRESH_TTL_MS } from '#modules/auth/server/domain/session/build-session.ts'
import type { AuthError } from '#modules/auth/server/domain/errors/auth.errors.ts'

type Deps = Readonly<{
  client: Readonly<{ refresh: (refreshToken: string) => Promise<Result<AuthTokens, AuthError>> }>
  store: SessionStore<Session>
  now: () => number
  decodeExp: (jwt: string) => number | null
}>

const doRefresh = async (
  deps: Deps,
  sessionId: SessionId,
  session: Session,
): Promise<Result<Session, AuthError>> => {
  const r = await deps.client.refresh(session.refreshToken)
  if (isErr(r)) {
    await deps.store.delete(sessionId) // sessão morta (rotated/revoked/expired)
    return err(r.error)
  }
  const tokens = r.value // refresh NOVO (rotação) — buildSession já leva o token novo p/ o store
  const next = buildSession({
    sessionId,
    tokens,
    persistent: session.persistent,
    nowMs: deps.now(),
    accessExpMs: deps.decodeExp(tokens.accessToken),
  })
  await deps.store.set(sessionId, next, REFRESH_TTL_MS)
  return ok(next)
}

export const createRefreshSession = (deps: Deps) => {
  const inFlight = new Map<string, Promise<Result<Session, AuthError>>>()
  return (sessionId: SessionId, session: Session): Promise<Result<Session, AuthError>> => {
    const existing = inFlight.get(sessionId)
    if (existing !== undefined) return existing
    const promise = doRefresh(deps, sessionId, session).finally(() => {
      inFlight.delete(sessionId)
    })
    inFlight.set(sessionId, promise)
    return promise
  }
}
