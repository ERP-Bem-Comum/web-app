/**
 * revoke-all-sessions server function (BE-REC-004) — encerra TODAS as sessões do usuário no core-api
 * (POST /auth/sessions/revoke-all, autenticado por access token), INCLUINDO a atual. Por isso, além da
 * revogação remota, faz o MESMO cleanup local do logout: apaga a sessão do store e limpa o cookie
 * `__Host-session`, deslogando o dispositivo atual. Idempotente (sem cookie/sessão → só responde ok).
 * §IX: o token NUNCA volta ao browser — a fn devolve só `{ ok: true }`.
 */
import { createServerFn } from '@tanstack/react-start'
import { getCookie, getRequestHeader, setResponseHeader } from '@tanstack/react-start/server'

import { isOk } from '#shared/primitives/result.ts'
import { isSameOriginRequest } from '#shared/http/csrf-origin.ts'
import { SESSION_COOKIE_NAME, clearSessionCookieHeader } from '#external/session/cookie.ts'
import type { SessionId } from '#modules/auth/server/domain/session/session.types.ts'
import { resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { authServer } from '#modules/auth/server/adapters/auth.composition.ts'

export const revokeAllSessionsFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<Readonly<{ ok: true }>> => {
    // CSRF de origem (FR-011) — mesma proteção do login/logout; complementa o CSRF global (src/start.ts).
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
    // Idempotente: sem sessão local → nada a revogar/limpar, só responde ok (igual ao logout).
    if (sessionId === undefined) return { ok: true }

    const server = authServer()

    // Auth: resolve o access token da sessão atual (refresh silencioso se preciso). null → sessão
    // inválida/expirada (o resolver já limpou o cookie); segue para o cleanup local por garantia.
    const accessToken = await resolveAccessTokenFn()
    if (accessToken !== null) {
      // Best-effort: revoga TODAS as sessões no core-api (inclui a atual). Se falhar remotamente, ainda
      // assim limpamos a sessão local abaixo — como o logout faz (não deixar "preso logado" no cliente).
      await server.revokeAllSessions(accessToken)
    }

    // A sessão atual também morreu no backend → mesmo cleanup do logout: apaga a sessão local e o cookie.
    const got = await server.store.get(sessionId)
    await server.logout(sessionId as SessionId, isOk(got) ? got.value.refreshToken : '')
    setResponseHeader('Set-Cookie', clearSessionCookieHeader())
    return { ok: true }
  },
)
