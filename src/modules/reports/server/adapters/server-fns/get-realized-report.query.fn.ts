/**
 * Server function: relatório Realizado × Planejado (GET /api/v2/reports/realized). Fronteira RPC (§III).
 * Input validado por Zod na borda (§IX): `year` obrigatório + filtros opcionais. Auth no HANDLER (não na
 * rota). Erro como valor (§V). O BFF entrega LINHAS ACHATADAS (uma por subcategoria folha); o client re-agrega.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reportsServer } from '../reports.composition.ts'
import type { RealizedBudgetRow } from '#modules/reports/server/domain/reports.io.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'

const GetRealizedReportInputSchema = z.object({
  year: z.int(),
  programId: z.string().trim().optional(),
  budgetPlanId: z.string().trim().optional(),
  partnerStateId: z.string().trim().optional(),
  partnerMunicipalityId: z.string().trim().optional(),
})

export type GetRealizedReportFnResult =
  | Readonly<{ ok: true; data: readonly RealizedBudgetRow[] }>
  | Readonly<{ ok: false; error: ReportsError }>

export const getRealizedReportFn = createServerFn({ method: 'GET' })
  .inputValidator(GetRealizedReportInputSchema)
  .handler(async ({ data }): Promise<GetRealizedReportFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reportsServer().getRealizedReport(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
