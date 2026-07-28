/**
 * Server function: relatório de Análise de Pagamentos (GET /api/v2/reports/analysis/payables, #446).
 * Fronteira RPC (§III). Input validado por Zod na borda (§IX): janela `dueStart/dueEnd` (`YYYY-MM-DD`,
 * dueEnd EXCLUSIVO) obrigatória + `status` opcional. Auth no HANDLER (não na rota). Erro como valor (§V).
 * O BFF entrega a matriz Plano → Centro de Custo × série mensal; o client re-agrega no shape da tela.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reportsServer } from '../reports.composition.ts'
import type { PaymentAnalysis } from '#modules/reports/server/domain/reports.io.ts'
import type { ReportsError } from '#modules/reports/server/domain/errors/reports.errors.ts'

const IsoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)

const GetPaymentAnalysisInputSchema = z.object({
  dueStart: IsoDateSchema,
  dueEnd: IsoDateSchema,
  status: z.string().trim().min(1).optional(),
})

export type GetPaymentAnalysisFnResult =
  | Readonly<{ ok: true; data: PaymentAnalysis }>
  | Readonly<{ ok: false; error: ReportsError }>

export const getPaymentAnalysisFn = createServerFn({ method: 'GET' })
  .inputValidator(GetPaymentAnalysisInputSchema)
  .handler(async ({ data }): Promise<GetPaymentAnalysisFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reportsServer().getPaymentAnalysis(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
