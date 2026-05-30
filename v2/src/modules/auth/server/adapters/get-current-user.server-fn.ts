/**
 * getCurrentUser server function — resolve a sessão (cookie → store → token, com refresh silencioso) e
 * devolve { userId } | null. Usada pelo route guard (beforeLoad) e pela UI (use-current-user). Se a sessão
 * morreu, limpa o cookie. Token NUNCA vai ao client — só o userId.
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie, setResponseHeader } from '@tanstack/react-start/server'

import { isErr, isOk } from '../../../../shared/primitives/result.ts'
import { SESSION_COOKIE_NAME } from '../../../../external/session/cookie.ts'
import type { SessionId } from '../domain/session.types.ts'
import { authServer } from './auth.composition.ts'

const clearCookie = (): void => {
  setResponseHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`)
}

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Readonly<{ userId: string }> | null> => {
    const sessionId = getCookie(SESSION_COOKIE_NAME)
    if (sessionId === undefined) return null

    const server = authServer()
    const resolved = await server.resolveSession(sessionId as SessionId)
    if (isErr(resolved)) {
      clearCookie()
      return null
    }

    const me = await server.getMe(resolved.value.accessToken)
    return isOk(me) ? { userId: me.value.userId } : null
  },
)
