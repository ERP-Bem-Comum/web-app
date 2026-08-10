/**
 * autocadastro-preview server function (#040) — a FRONTEIRA RPC (GET) do preview do Autocadastro.
 * Rota PÚBLICA (sem sessão): quem chega aqui traz apenas o `token` do link de e-mail. NÃO chama
 * getCurrentUserFn/resolveAccessTokenFn (o colaborador pode não ter conta). Valida o input (Zod) e
 * chama o core-api público via composition. Erros = valores (§II/§V): token desconhecido/expirado/usado
 * → `autocadastro-invalid` (404, anti-enumeração); rede/5xx → 'connectivity'/'server'.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { logger } from '#external/logging/logger.ts'
import { getRequestId } from '#external/http/request-id.ts'
import { AutocadastroPreviewInputSchema } from '#modules/partners/server/adapters/collaborator-autocadastro.io-schemas.ts'
import { collaboratorAutocadastroServer } from '../../collaborator-autocadastro.composition.ts'
import type { AutocadastroPreview } from '#modules/partners/server/domain/collaborator/collaborator-autocadastro.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type AutocadastroPreviewFnResult =
  | Readonly<{ ok: true; data: AutocadastroPreview }>
  | Readonly<{ ok: false; error: PartnersError }>

export const autocadastroPreviewFn = createServerFn({ method: 'GET' })
  .inputValidator(AutocadastroPreviewInputSchema)
  .handler(async ({ data }): Promise<AutocadastroPreviewFnResult> => {
    try {
      const r = await collaboratorAutocadastroServer().autocadastroPreview(data.token)
      if (isErr(r)) return { ok: false, error: r.error }
      return { ok: true, data: r.value }
    } catch (cause) {
      logger.error(
        { err: cause, fn: 'autocadastroPreviewFn', request_id: getRequestId() },
        'autocadastro-preview-server-fn:unhandled-exception',
      )
      return { ok: false, error: 'server' }
    }
  })
