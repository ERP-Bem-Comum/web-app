/**
 * Server function: detalhe de documento financeiro (GET /api/v2/financial/documents/:id). Fronteira RPC
 * (§III). Devolve documento + payables[]. RBAC `fiscal-document:read` (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import type { DocumentDetail } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type GetDocumentFnResult =
  | Readonly<{ ok: true; data: DocumentDetail }>
  | Readonly<{ ok: false; error: FinancialError }>

export const getDocumentFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.uuid() }))
  .handler(async ({ data }): Promise<GetDocumentFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().getDocument(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
