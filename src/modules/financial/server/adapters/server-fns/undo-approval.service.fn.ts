/**
 * Server function: desfazer aprovação (POST /api/v2/financial/documents/:id/undo-approval, Aprovado →
 * Aberto). Fronteira RPC (§III). RBAC `payable:approve`. UI na onda 2.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { ApproveInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { DocumentDetail } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type UndoApprovalFnResult =
  | Readonly<{ ok: true; data: DocumentDetail }>
  | Readonly<{ ok: false; error: FinancialError }>

export const undoApprovalFn = createServerFn({ method: 'POST' })
  .inputValidator(ApproveInputSchema)
  .handler(async ({ data }): Promise<UndoApprovalFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().undoApproval(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
