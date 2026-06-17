/**
 * Server function: lista de documentos financeiros (GET /api/v2/financial/documents). Fronteira RPC
 * (§III). Autentica via sessão, valida a query, chama o use-case. ⚠️ Fatia 1: o backend devolve lista
 * VAZIA (stub). RBAC `fiscal-document:read` é cobrado pelo core-api (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { ListDocumentsInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { DocumentListResponse } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type ListDocumentsFnResult =
  | Readonly<{ ok: true; data: DocumentListResponse }>
  | Readonly<{ ok: false; error: FinancialError }>

export const listDocumentsFn = createServerFn({ method: 'GET' })
  .inputValidator(ListDocumentsInputSchema)
  .handler(async ({ data }): Promise<ListDocumentsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().listDocuments(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
