/**
 * Server function: desfazer uma conciliação (POST /api/v2/financial/reconciliations/:id/undo). Fronteira
 * RPC (§III). Transação volta a pendente, título a Pago; registro preservado como desfeito. RBAC
 * `reconciliation:write` (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { UndoReconciliationInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { ReconciliationUndone } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type UndoReconciliationFnResult =
  | Readonly<{ ok: true; data: ReconciliationUndone }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const undoReconciliationFn = createServerFn({ method: 'POST' })
  .inputValidator(UndoReconciliationInputSchema)
  .handler(async ({ data }): Promise<UndoReconciliationFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().undoReconciliation(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
