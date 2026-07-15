/**
 * Server function: relatório de Posição de Pagamentos. GET /api/v2/reports/payment-position →
 * { positions: [...] }. Fronteira RPC (§III). Sem input. Auth no HANDLER. Erro como valor (§V).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reportsServer } from '../reports.composition.ts'
import type { PaymentPosition } from '#modules/reports/server/domain/reports.io.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'

export type GetPaymentPositionFnResult =
  | Readonly<{ ok: true; data: readonly PaymentPosition[] }>
  | Readonly<{ ok: false; error: ReportsError }>

export const getPaymentPositionFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<GetPaymentPositionFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reportsServer().getPaymentPosition(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
