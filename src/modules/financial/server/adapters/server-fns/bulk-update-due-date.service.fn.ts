/**
 * Server function: alterar vencimento em LOTE (PATCH /api/v2/financial/documents/due-date). Fronteira RPC
 * (§III). Um mesmo `dueDate` p/ N documentos; cada item leva o `version` (optimistic lock). RBAC
 * `fiscal-document:write`. Falha PARCIAL por item — o resultado carrega o `outcome` de cada documento
 * (`ok | not-found | version-conflict | invalid-state | error`); quem interpreta é o binding. #162.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { BulkUpdateDueDateInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { BulkUpdateDueDateResult } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type BulkUpdateDueDateFnResult =
  | Readonly<{ ok: true; data: BulkUpdateDueDateResult }>
  | Readonly<{ ok: false; error: FinancialError }>

export const bulkUpdateDueDateFn = createServerFn({ method: 'POST' })
  .inputValidator(BulkUpdateDueDateInputSchema)
  .handler(async ({ data }): Promise<BulkUpdateDueDateFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().bulkUpdateDueDate(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
