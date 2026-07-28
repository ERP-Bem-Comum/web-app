/**
 * Server function: relatório de Posição de Pagamentos. GET /api/v2/reports/payment-position →
 * { positions: [...] }. Fronteira RPC (§III). Input validado por Zod na borda (§IX): 8 filtros OPCIONAIS
 * (#588) — refs UUID, janela de vencimento [dueFrom, dueTo) e status (enum de 6). Auth no HANDLER (não na
 * rota). Erro como valor (§V).
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reportsServer } from '../reports.composition.ts'
import type { PaymentPosition } from '#modules/reports/server/domain/reports.io.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'

// `YYYY-MM-DD` — a page manda a data crua; o backend trata o `dueTo` como EXCLUSIVO (janela half-open).
const IsoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)

const GetPaymentPositionInputSchema = z.object({
  budgetPlanRef: z.string().trim().min(1).optional(),
  cedenteAccountRef: z.string().trim().min(1).optional(),
  costCenterRef: z.string().trim().min(1).optional(),
  categoryRef: z.string().trim().min(1).optional(),
  subcategoryRef: z.string().trim().min(1).optional(),
  supplierRef: z.string().trim().min(1).optional(),
  dueFrom: IsoDateSchema.optional(),
  dueTo: IsoDateSchema.optional(),
  status: z.enum(['Open', 'Approved', 'Transmitted', 'Paid', 'PartiallyReconciled', 'Reconciled']).optional(),
})

export type GetPaymentPositionFnResult =
  | Readonly<{ ok: true; data: readonly PaymentPosition[] }>
  | Readonly<{ ok: false; error: ReportsError }>

export const getPaymentPositionFn = createServerFn({ method: 'GET' })
  .inputValidator(GetPaymentPositionInputSchema)
  .handler(async ({ data }): Promise<GetPaymentPositionFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reportsServer().getPaymentPosition(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
