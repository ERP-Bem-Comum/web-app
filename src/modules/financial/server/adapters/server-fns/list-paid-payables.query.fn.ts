/**
 * Server function: listar títulos Pagos conciliáveis (GET /api/v2/financial/payables?status=Paid).
 * Fronteira RPC (§III). Só títulos Pago são conciliáveis (regra de domínio). Sem input. RBAC
 * `reconciliation:read` (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import type { PaidPayable } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ListPaidPayablesFnResult =
  | Readonly<{ ok: true; data: readonly PaidPayable[] }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const listPaidPayablesFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ListPaidPayablesFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().listPaidPayables(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
