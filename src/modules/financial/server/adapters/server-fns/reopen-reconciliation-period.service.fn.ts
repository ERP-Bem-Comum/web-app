/**
 * Server function: reabrir o período de conciliação (POST /api/v2/financial/reconciliation-periods/:id/
 * reopen, #203, Closed → Open). Fronteira RPC (§III). RBAC `reconciliation:close` (403 → 'forbidden').
 * O ator (reopenedBy) vem do servidor; o client envia só o periodId.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { ReopenPeriodInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { PeriodReopened } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ReopenPeriodFnResult =
  | Readonly<{ ok: true; data: PeriodReopened }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const reopenReconciliationPeriodFn = createServerFn({ method: 'POST' })
  .inputValidator(ReopenPeriodInputSchema)
  .handler(async ({ data }): Promise<ReopenPeriodFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().reopenPeriod(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
