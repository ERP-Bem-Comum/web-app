/**
 * logout server function — lê o cookie de sessão, recupera o refresh do store, chama o use-case
 * (revoga no core-api + apaga a sessão), e limpa o cookie. Idempotente (sem cookie → só responde ok).
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie, getRequestHeader, setResponseHeader } from '@tanstack/react-start/server'

import { isOk } from '#shared/primitives/result.ts'
import { isSameOriginRequest } from '#shared/http/csrf-origin.ts'
import { SESSION_COOKIE_NAME, clearSessionCookieHeader } from '#external/session/cookie.ts'
import type { SessionId } from '#modules/auth/server/domain/session/session.types.ts'
import { authServer } from '#modules/auth/server/adapters/auth.composition.ts'

export const logoutFn = createServerFn({ method: 'POST' }).handler(async (): Promise<Readonly<{ ok: true }>> => {
  // CSRF de origem (FR-011) — mesma proteção do login; complementa o CSRF global do Start (src/start.ts).
  if (
    !isSameOriginRequest({
      origin: getRequestHeader('origin') ?? null,
      host: getRequestHeader('host') ?? null,
      secFetchSite: getRequestHeader('sec-fetch-site') ?? null,
    })
  ) {
    throw new Error('forbidden')
  }

  const sessionId = getCookie(SESSION_COOKIE_NAME)
  if (sessionId !== undefined) {
    const server = authServer()
    const got = await server.store.get(sessionId)
    await server.logout(sessionId as SessionId, isOk(got) ? got.value.refreshToken : '')
  }
  setResponseHeader('Set-Cookie', clearSessionCookieHeader())
  return { ok: true }
})
