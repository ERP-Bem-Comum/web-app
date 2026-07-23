/**
 * Server function: contagem agregada por status (chips do grid de Contas a Pagar) — #536.
 * GET /api/v2/financial/payable-titles/counts. 1 request no lugar de ~6 (uma por chip). Fronteira RPC
 * (§III), RBAC `financial:read` no core-api (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { PayableCountsInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { PayableCounts } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type PayableCountsFnResult =
  | Readonly<{ ok: true; data: PayableCounts }>
  | Readonly<{ ok: false; error: FinancialError }>

export const listPayableCountsFn = createServerFn({ method: 'GET' })
  .inputValidator(PayableCountsInputSchema)
  .handler(async ({ data }): Promise<PayableCountsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().getPayableCounts(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
