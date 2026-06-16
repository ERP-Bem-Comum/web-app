/**
 * Server function: cancelar documento (DELETE /api/v2/financial/documents/:id). Fronteira RPC (§III). Só
 * em Aberto; hard-delete (documento + títulos). 204 sem corpo. RBAC `fiscal-document:cancel`. UI na onda 2.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { CancelInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type CancelDocumentFnResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; error: FinancialError }>

export const cancelDocumentFn = createServerFn({ method: 'POST' })
  .inputValidator(CancelInputSchema)
  .handler(async ({ data }): Promise<CancelDocumentFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().cancelDocument(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true }
  })
