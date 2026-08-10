/**
 * reset-password server function — a FRONTEIRA RPC (client↔server) do fluxo "Redefinir Senha" (#038).
 * Rota PÚBLICA (sem sessão): quem chega aqui traz apenas o `token` do link de e-mail. Valida o input
 * (Zod), checa CSRF de origem (defense-in-depth) e chama o core-api via composition. Erros = valores
 * (§II/§V): 400 (token inválido/expirado/usado) → `error: 'reset-token-invalid'`; rede/5xx → 'server'/
 * 'connectivity'. A UI mostra "link inválido" só a partir de 'reset-token-invalid' (não vaza o subcaso).
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

const ResetPasswordFnInputSchema = z.object({
  // Zod valida a borda (§IX). O token vem do link; a senha é o mínimo aceito pela policy (fonte única).
  token: z.string().trim().min(1),
  newPassword: z.string().trim().min(1),
})

export type ResetPasswordFnResult =
  | Readonly<{ ok: true }>
  // 'reset-token-invalid' = link inválido/expirado/usado (400). Rede/5xx → 'connectivity'/'server'.
  | Readonly<{ ok: false; error: AuthError; reference?: string }>

export const resetPasswordFn = createServerFn({ method: 'POST' })
  .inputValidator(ResetPasswordFnInputSchema)
  .handler(async ({ data }): Promise<ResetPasswordFnResult> => {
    if (
      !isSameOriginRequest({
        origin: getRequestHeader('origin') ?? null,
        host: getRequestHeader('host') ?? null,
        secFetchSite: getRequestHeader('sec-fetch-site') ?? null,
      })
    ) {
      logger.warn(
        { fn: 'resetPasswordFn', request_id: getRequestId() },
        'reset-password-server-fn:csrf-origin-rejected',
      )
      throw new Error('forbidden')
    }

    try {
      const r = await authServer().resetPassword(data)
      if (isErr(r)) {
        // 'server' = erro INESPERADO (5xx/não-mapeado) → anexa o reference (= request_id) p/ correlação.
        return r.error === 'server'
          ? { ok: false, error: r.error, reference: getRequestId() }
          : { ok: false, error: r.error }
      }
      return { ok: true }
    } catch (cause) {
      logger.error(
        { err: cause, fn: 'resetPasswordFn', request_id: getRequestId() },
        'reset-password-server-fn:unhandled-exception',
      )
      return { ok: false, error: 'server', reference: getRequestId() }
    }
  })
