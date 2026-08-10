/**
 * Server function: widget "Últimos pagamentos" do Dashboard (042).
 * GET /api/v2/financial/dashboard/recent-payments → Top-5 títulos pagos. Fronteira RPC (§III). Sem input.
 * RBAC `reference:read` no core-api (403 → 'forbidden'). Auth no HANDLER (não na rota).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import type { RecentPayment } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type RecentPaymentsFnResult =
  | Readonly<{ ok: true; data: readonly RecentPayment[] }>
  | Readonly<{ ok: false; error: FinancialError }>

export const recentPaymentsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<RecentPaymentsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().getRecentPayments(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
