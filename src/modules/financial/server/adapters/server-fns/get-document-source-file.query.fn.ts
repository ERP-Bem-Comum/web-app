/**
 * Server function: comprovante-fonte de um documento (GET /api/v2/financial/documents/:id/source-file —
 * core-api#568). Fronteira RPC (§III) e ÚNICA via de acesso ao arquivo: o BFF busca os bytes COM o token de
 * sessão e devolve `base64 + mimeType` ao client (que monta o blob/File). O token NUNCA volta ao browser e a
 * URL do core-api nunca é exposta (CA4). RBAC `fiscal-document:read` (403 → 'forbidden'); sem anexo → 404.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import type { DocumentSourceFile } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type GetDocumentSourceFileFnResult =
  | Readonly<{ ok: true; data: DocumentSourceFile }>
  | Readonly<{ ok: false; error: FinancialError }>

export const getDocumentSourceFileFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.uuid() }))
  .handler(async ({ data }): Promise<GetDocumentSourceFileFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().getDocumentSourceFile(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
