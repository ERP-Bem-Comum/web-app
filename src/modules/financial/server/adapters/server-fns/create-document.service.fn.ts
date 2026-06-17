/**
 * Server function: lançar documento (POST /api/v2/financial/documents, asDraft:false → Aberto). Fronteira
 * RPC (§III). O backend gera 1 título pai (líquido) + 1 filho por retenção e devolve o documento. RBAC
 * `fiscal-document:write` (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { CreateDocumentInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { DocumentDetail } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type CreateDocumentFnResult =
  | Readonly<{ ok: true; data: DocumentDetail }>
  | Readonly<{ ok: false; error: FinancialError }>

export const createDocumentFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateDocumentInputSchema)
  .handler(async ({ data }): Promise<CreateDocumentFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().createDocument(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
