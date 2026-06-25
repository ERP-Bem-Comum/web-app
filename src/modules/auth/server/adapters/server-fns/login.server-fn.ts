/**
 * login server function — a FRONTEIRA RPC (client↔server). Valida input (Zod), checa CSRF de origem
 * (defense-in-depth; o Start já protege sem src/start.ts), chama o use-case, seta o cookie de sessão
 * (sessionId opaco) e devolve SÓ { userId } ao client (token NUNCA sai daqui). Erros de auth = valor
 * ({ ok:false, error }) — o repository do client converte em QueryError/tag.
 */
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader, setResponseHeader } from '@tanstack/react-start/server'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { buildSessionCookie, serializeCookie } from '#external/session/cookie.ts'
import { logger } from '#external/logging/logger.ts'
import { getRequestId } from '#external/http/request-id.ts'
import { isSameOriginRequest } from '#shared/http/csrf-origin.ts'
import type { AuthError } from '#modules/auth/server/domain/errors/auth.errors.ts'
import { authServer } from '#modules/auth/server/adapters/auth.composition.ts'

const LoginFnInputSchema = z.object({
  email: z.string().trim(),
  password: z.string().trim(),
  rememberDevice: z.boolean(),
})

export type LoginFnResult = Readonly<{ ok: true; userId: string }> | Readonly<{ ok: false; error: AuthError }>

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator(LoginFnInputSchema)
  .handler(async ({ data }): Promise<LoginFnResult> => {
    if (
      !isSameOriginRequest({
        origin: getRequestHeader('origin') ?? null,
        host: getRequestHeader('host') ?? null,
        secFetchSite: getRequestHeader('sec-fetch-site') ?? null,
      })
    ) {
      logger.warn({ fn: 'loginFn', request_id: getRequestId() }, 'login-server-fn:csrf-origin-rejected')
      throw new Error('forbidden')
    }

    try {
      const r = await authServer().login(data)
      if (isErr(r)) return { ok: false, error: r.error }

      const session = r.value
      const maxAgeSeconds = Math.max(0, Math.floor((session.refreshExpiresAt - Date.now()) / 1000))
      setResponseHeader(
        'Set-Cookie',
        serializeCookie(
          buildSessionCookie(session.sessionId, { persistent: session.persistent, maxAgeSeconds }),
        ),
      )
      return { ok: true, userId: session.userId }
    } catch (cause) {
      // Catch-all da FRONTEIRA: exceção não prevista (bug em composition/cookie/crypto) que hoje subia
      // sem rastro e chegava ao client como erro genérico/`ok:null`. Logamos o stack e devolvemos um
      // Result tipado — o client passa a ver `error: 'server'` (limpo), e o stack vive no log do BFF.
      logger.error({ err: cause, fn: 'loginFn', request_id: getRequestId() }, 'login-server-fn:unhandled-exception')
      return { ok: false, error: 'server' }
    }
  })
