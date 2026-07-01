/**
 * request-password-reset server function — a FRONTEIRA RPC (client↔server) do fluxo "Esqueci Minha Senha".
 * Rota PÚBLICA (sem sessão). Valida o input (Zod), checa CSRF de origem (defense-in-depth) e chama o
 * core-api via composition. Anti-enumeração (BE-REC-003): o core-api responde SEMPRE 202 — a fn devolve
 * `{ ok:true }` sempre que a chamada COMPLETA, NUNCA revelando se o e-mail existe. Só falhas de
 * conectividade/servidor (rede/5xx) viram `{ ok:false, error }`. Erros = valores (§II/§V).
 */
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { logger } from '#external/logging/logger.ts'
import { getRequestId } from '#external/http/request-id.ts'
import { isSameOriginRequest } from '#shared/http/csrf-origin.ts'
import type { AuthError } from '#modules/auth/server/domain/errors/auth.errors.ts'
import { authServer } from '#modules/auth/server/adapters/auth.composition.ts'

const RequestPasswordResetFnInputSchema = z.object({
  // Zod valida o e-mail na borda (§IX). Só o e-mail cruza a fronteira.
  email: z.email(),
})

export type RequestPasswordResetFnResult =
  | Readonly<{ ok: true }>
  // Só falhas de transporte/servidor chegam aqui — nunca "e-mail não encontrado" (anti-enumeração).
  | Readonly<{ ok: false; error: AuthError; reference?: string }>

export const requestPasswordResetFn = createServerFn({ method: 'POST' })
  .inputValidator(RequestPasswordResetFnInputSchema)
  .handler(async ({ data }): Promise<RequestPasswordResetFnResult> => {
    if (
      !isSameOriginRequest({
        origin: getRequestHeader('origin') ?? null,
        host: getRequestHeader('host') ?? null,
        secFetchSite: getRequestHeader('sec-fetch-site') ?? null,
      })
    ) {
      logger.warn(
        { fn: 'requestPasswordResetFn', request_id: getRequestId() },
        'request-password-reset-server-fn:csrf-origin-rejected',
      )
      throw new Error('forbidden')
    }

    try {
      const r = await authServer().forgotPassword(data)
      // Anti-enumeração: 202 (ok) SEMPRE devolve sucesso uniforme, sem sinalizar se o e-mail existe.
      if (isErr(r)) {
        // 'server' = erro INESPERADO (5xx/não-mapeado) → anexa o reference (= request_id) p/ correlação.
        return r.error === 'server'
          ? { ok: false, error: r.error, reference: getRequestId() }
          : { ok: false, error: r.error }
      }
      return { ok: true }
    } catch (cause) {
      logger.error(
        { err: cause, fn: 'requestPasswordResetFn', request_id: getRequestId() },
        'request-password-reset-server-fn:unhandled-exception',
      )
      return { ok: false, error: 'server', reference: getRequestId() }
    }
  })
