/**
 * Resolve o access token JWT da sessão atual (server-only).
 * Replica a lógica do auth guard: cookie → store → token, com refresh silencioso.
 * Retorna o token ou null se a sessão for inválida/expirada.
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie, setResponseHeader } from '@tanstack/react-start/server'

import { isErr } from '#shared/primitives/result.ts'
import { SESSION_COOKIE_NAME, clearSessionCookieHeader } from '#external/session/cookie.ts'
import type { SessionId } from '#modules/auth/server/domain/session/session.types.ts'
import { authServer } from '#modules/auth/server/adapters/auth.composition.ts'

export const resolveAccessTokenFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<string | null> => {
    const sessionId = getCookie(SESSION_COOKIE_NAME)
    if (sessionId === undefined) return null

    const server = authServer()
    const resolved = await server.resolveSession(sessionId as SessionId)
    if (isErr(resolved)) {
      setResponseHeader('Set-Cookie', clearSessionCookieHeader())
      return null
    }

    return resolved.value.accessToken
  },
)
