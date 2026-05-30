/**
 * login use-case — valida o email (UX/anti-request inútil) → core-api login → cria a Session →
 * grava no store. Devolve a Session (a server fn seta o cookie sessionId). Token nunca sai daqui p/ o browser.
 * Email com formato inválido → `invalid-credentials` (mesma resposta do backend → anti-enumeração).
 */
import { ok, err, isErr, type Result } from '../../../../shared/primitives/result.ts'
import type { SessionStore } from '../../../../shared/ports/session-store.port.ts'
import type { Session, SessionId, AuthTokens } from '../domain/session.types.ts'
import { Email } from '../domain/email.value-object.ts'
import { buildSession, REFRESH_TTL_MS } from '../domain/build-session.ts'
import type { AuthError } from '../domain/auth.errors.ts'

export type LoginInput = Readonly<{ email: string; password: string; rememberDevice: boolean }>

type Deps = Readonly<{
  client: Readonly<{
    login: (input: Readonly<{ email: string; password: string }>) => Promise<Result<AuthTokens, AuthError>>
  }>
  store: SessionStore<Session>
  now: () => number
  decodeExp: (jwt: string) => number | null
  genId: () => SessionId
}>

export const createLogin =
  (deps: Deps) =>
  async (input: LoginInput): Promise<Result<Session, AuthError>> => {
    const email = Email(input.email)
    if (isErr(email)) return err('invalid-credentials')

    const r = await deps.client.login({ email: email.value, password: input.password })
    if (isErr(r)) return err(r.error)

    const sessionId = deps.genId()
    const session = buildSession({
      sessionId,
      tokens: r.value,
      persistent: input.rememberDevice,
      nowMs: deps.now(),
      accessExpMs: deps.decodeExp(r.value.accessToken),
    })
    await deps.store.set(sessionId, session, REFRESH_TTL_MS)
    return ok(session)
  }
