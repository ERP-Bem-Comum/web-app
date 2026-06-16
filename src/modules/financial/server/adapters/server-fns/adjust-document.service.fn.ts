/**
 * Server function: ajustar documento (PATCH /api/v2/financial/documents/:id). Fronteira RPC (§III). Só em
 * Aberto; regenera os títulos filhos. RBAC `fiscal-document:write`. (UI desce na onda 2.)
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { AdjustDocumentInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { DocumentDetail } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type AdjustDocumentFnResult =
  | Readonly<{ ok: true; data: DocumentDetail }>
  | Readonly<{ ok: false; error: FinancialError }>

export const adjustDocumentFn = createServerFn({ method: 'POST' })
  .inputValidator(AdjustDocumentInputSchema)
  .handler(async ({ data }): Promise<AdjustDocumentFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().adjustDocument(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
