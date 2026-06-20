/**
 * Server function: listar períodos de conciliação de uma conta (GET /api/v2/financial/reconciliation-
 * periods?debitAccountRef=, #173). Fronteira RPC (§III). RBAC `reconciliation:read` no core-api. Fornece o
 * `periodId` p/ o export real (OFX/CSV) no footer do workspace.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { ListReconciliationPeriodsInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { ReconciliationPeriod } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ListReconciliationPeriodsFnResult =
  | Readonly<{ ok: true; data: readonly ReconciliationPeriod[] }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const listReconciliationPeriodsFn = createServerFn({ method: 'GET' })
  .inputValidator(ListReconciliationPeriodsInputSchema)
  .handler(async ({ data }): Promise<ListReconciliationPeriodsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().listReconciliationPeriods(
      { debitAccountRef: data.debitAccountRef },
      accessToken,
    )
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
