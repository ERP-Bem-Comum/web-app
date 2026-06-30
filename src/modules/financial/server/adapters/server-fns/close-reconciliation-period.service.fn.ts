/**
 * Server function: fechar o período de conciliação de uma conta (POST /api/v2/financial/
 * reconciliation-periods/close). Fronteira RPC (§III). Bloqueado se houver pendentes (422
 * period-has-pending-transactions). RBAC `reconciliation:close` (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { ClosePeriodInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { PeriodClosed } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ClosePeriodFnResult =
  | Readonly<{ ok: true; data: PeriodClosed }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const closeReconciliationPeriodFn = createServerFn({ method: 'POST' })
  .inputValidator(ClosePeriodInputSchema)
  .handler(async ({ data }): Promise<ClosePeriodFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().closePeriod(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
