/**
 * Server function: baixa manual de UM título (POST /api/v2/financial/documents/:id/payables/:payableId/
 * manual-payment, Aprovado → Pago, #224). Fronteira RPC (§III). RBAC `payable:approve`. O `paidAt` é
 * gravado server-side (momento da baixa). `version` = do DOCUMENTO (optimistic lock do agregado).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { ManualPaymentInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { DocumentDetail } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type RegisterManualPaymentFnResult =
  | Readonly<{ ok: true; data: DocumentDetail }>
  | Readonly<{ ok: false; error: FinancialError }>

export const registerManualPaymentFn = createServerFn({ method: 'POST' })
  .inputValidator(ManualPaymentInputSchema)
  .handler(async ({ data }): Promise<RegisterManualPaymentFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().registerManualPayment(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
