/**
 * Server function: lançamento manual de uma transação sem título (POST /api/v2/financial/
 * statement-transactions/:id/manual-entry). Fronteira RPC (§III). Valor derivado da transação;
 * Transfer/Investment/Redemption exigem conta de destino (gating na UI). RBAC `reconciliation:write`.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { ManualEntryInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { ManualEntryCreated } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ManualEntryFnResult =
  | Readonly<{ ok: true; data: ManualEntryCreated }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const createManualEntryFn = createServerFn({ method: 'POST' })
  .inputValidator(ManualEntryInputSchema)
  .handler(async ({ data }): Promise<ManualEntryFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().createManualEntry(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
