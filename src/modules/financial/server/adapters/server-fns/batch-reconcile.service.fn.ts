/**
 * Server function: conciliar em lote (POST /api/v2/financial/reconciliations/batch). Fronteira RPC
 * (§III). Best-effort: falhas parciais voltam em `failed` (não abortam o lote). RBAC
 * `reconciliation:write` (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { BatchReconcileInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { BatchResult } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type BatchReconcileFnResult =
  | Readonly<{ ok: true; data: BatchResult }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const batchReconcileFn = createServerFn({ method: 'POST' })
  .inputValidator(BatchReconcileInputSchema)
  .handler(async ({ data }): Promise<BatchReconcileFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().batchReconcile(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
