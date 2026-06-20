/**
 * Server function: conciliar uma transação (POST /api/v2/financial/reconciliations). Fronteira RPC
 * (§III). 1:1, N:1 ou parcial; o backend revalida o balanceamento (422 reconciliation-not-balanced).
 * RBAC `reconciliation:write` (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { CreateReconciliationInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { ReconciliationCreated } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type CreateReconciliationFnResult =
  | Readonly<{ ok: true; data: ReconciliationCreated }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const createReconciliationFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateReconciliationInputSchema)
  .handler(async ({ data }): Promise<CreateReconciliationFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().createReconciliation(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
