/**
 * autocadastro-submit server function (#040) — a FRONTEIRA RPC (POST) do envio do Autocadastro.
 * Rota PÚBLICA (sem sessão): o colaborador confirma os primeiros dígitos do CPF + preenche a 2ª fase.
 * NÃO chama getCurrentUserFn/resolveAccessTokenFn. Valida o input (Zod), checa CSRF de origem
 * (defense-in-depth, como reset-password) e chama o core-api público via composition. Erros = valores
 * (§II/§V): 400 cpf-mismatch → `autocadastro-cpf-mismatch` (form preservado); 404 → `autocadastro-invalid`;
 * rede/5xx → 'connectivity'/'server'. O token nunca volta ao browser além do search param do link.
 */
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

import { isErr } from '#shared/primitives/result.ts'
import { logger } from '#external/logging/logger.ts'
import { getRequestId } from '#external/http/request-id.ts'
import { isSameOriginRequest } from '#shared/http/csrf-origin.ts'
import { AutocadastroSubmitInputSchema } from '#modules/partners/server/adapters/collaborator-autocadastro.io-schemas.ts'
import { collaboratorAutocadastroServer } from '../../collaborator-autocadastro.composition.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type AutocadastroSubmitFnResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; error: PartnersError }>

export const autocadastroSubmitFn = createServerFn({ method: 'POST' })
  .inputValidator(AutocadastroSubmitInputSchema)
  .handler(async ({ data }): Promise<AutocadastroSubmitFnResult> => {
    if (
      !isSameOriginRequest({
        origin: getRequestHeader('origin') ?? null,
        host: getRequestHeader('host') ?? null,
        secFetchSite: getRequestHeader('sec-fetch-site') ?? null,
      })
    ) {
      logger.warn(
        { fn: 'autocadastroSubmitFn', request_id: getRequestId() },
        'autocadastro-submit-server-fn:csrf-origin-rejected',
      )
      throw new Error('forbidden')
    }

    try {
      const r = await collaboratorAutocadastroServer().autocadastroSubmit(data)
      if (isErr(r)) return { ok: false, error: r.error }
      return { ok: true }
    } catch (cause) {
      logger.error(
        { err: cause, fn: 'autocadastroSubmitFn', request_id: getRequestId() },
        'autocadastro-submit-server-fn:unhandled-exception',
      )
      return { ok: false, error: 'server' }
    }
  })
