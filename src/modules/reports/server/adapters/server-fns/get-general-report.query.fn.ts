/**
 * Server function: Relatório Geral (#442). GET /api/v2/reports/generalReport → página plana de títulos a-pagar
 * (Slice A+B+C+D). Fronteira RPC (§III). Input validado por Zod na borda (§IX): paginação (page/limit) + 11
 * filtros OPCIONAIS + busca. Auth no HANDLER (não na rota). Erro como valor (§V). Espelha `get-payment-position`.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reportsServer } from '../reports.composition.ts'
import type { GeneralReportPage } from '#modules/reports/server/domain/reports.io.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'

const IsoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)

const GetGeneralReportInputSchema = z.object({
  page: z.int().min(1),
  limit: z.int().min(1).max(200),
  search: z.string().trim().min(1).optional(),
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

export type GetGeneralReportFnResult =
  | Readonly<{ ok: true; data: GeneralReportPage }>
  | Readonly<{ ok: false; error: ReportsError }>

export const getGeneralReportFn = createServerFn({ method: 'GET' })
  .inputValidator(GetGeneralReportInputSchema)
  .handler(async ({ data }): Promise<GetGeneralReportFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reportsServer().getGeneralReport(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
