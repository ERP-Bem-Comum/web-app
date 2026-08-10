/**
 * Server function: alterar o vencimento de UM título ISOLADO (PATCH /api/v2/financial/documents/:id/payables/
 * :payableId — #270). Fronteira RPC (§III). RBAC `fiscal-document:write`. Optimistic lock via `version`.
 * NÃO propaga ao documento-pai nem aos irmãos (contrasta com o `adjust`/lote). Devolve o documento atualizado.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { UpdatePayableDueDateInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { DocumentDetail } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type UpdatePayableDueDateFnResult =
  | Readonly<{ ok: true; data: DocumentDetail }>
  | Readonly<{ ok: false; error: FinancialError }>

export const updatePayableDueDateFn = createServerFn({ method: 'POST' })
  .inputValidator(UpdatePayableDueDateInputSchema)
  .handler(async ({ data }): Promise<UpdatePayableDueDateFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().updatePayableDueDate(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
