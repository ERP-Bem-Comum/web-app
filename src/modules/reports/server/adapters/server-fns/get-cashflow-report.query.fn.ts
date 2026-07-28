/**
 * Server function: relatório de Fluxo de Caixa (#590). Compõe GET /api/v2/reports/cashflow (árvore Saídas) +
 * /cashflow/chart (série temporal) numa resposta ÚNICA por caso de uso (§III). Fronteira RPC. Input validado
 * por Zod na borda (§IX): 10 filtros OPCIONAIS (AND) — refs UUID, janela [dueFrom, dueTo) e status. Auth no
 * HANDLER (não na rota). Erro como valor (§V). Espelha `get-payment-position.query.fn.ts`.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reportsServer } from '../reports.composition.ts'
import type { CashflowReport } from '#modules/reports/server/domain/reports.io.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'

// `YYYY-MM-DD` — a page manda a data crua; o backend trata o `dueTo` como EXCLUSIVO (janela half-open).
const IsoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)

const GetCashflowReportInputSchema = z.object({
  programId: z.string().trim().min(1).optional(),
  budgetPlanId: z.string().trim().min(1).optional(),
  dueFrom: IsoDateSchema.optional(),
  dueTo: IsoDateSchema.optional(),
  accountId: z.string().trim().min(1).optional(),
  costCenterId: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  subCategoryId: z.string().trim().min(1).optional(),
  entityId: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
})

export type GetCashflowReportFnResult =
  | Readonly<{ ok: true; data: CashflowReport }>
  | Readonly<{ ok: false; error: ReportsError }>

export const getCashflowReportFn = createServerFn({ method: 'GET' })
  .inputValidator(GetCashflowReportInputSchema)
  .handler(async ({ data }): Promise<GetCashflowReportFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reportsServer().getCashflowReport(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
