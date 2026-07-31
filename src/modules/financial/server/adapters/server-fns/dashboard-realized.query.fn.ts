/**
 * Server function: gráfico "Realizado × Previsto" do Dashboard (specs/096 · P3). Fronteira RPC (§III).
 * Input validado por Zod na borda (§IX): `year` + seleção (todos | 1 plano). Auth no HANDLER (não na
 * rota). O BFF lista os planos aprovados vigentes, busca a(s) série(s) do realized (fan-out no "todos") e
 * entrega o chart pronto + as opções do dropdown. RBAC `reference:read` no core-api (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import type { DashboardRealizedResult } from '#modules/financial/server/domain/dashboard-realized.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

const RealizedSelectionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all') }),
  z.object({ kind: z.literal('plan'), budgetPlanId: z.string().trim().min(1) }),
])

const DashboardRealizedInputSchema = z.object({
  year: z.int(),
  selection: RealizedSelectionSchema,
})

export type DashboardRealizedFnResult =
  | Readonly<{ ok: true; data: DashboardRealizedResult }>
  | Readonly<{ ok: false; error: FinancialError }>

export const dashboardRealizedFn = createServerFn({ method: 'GET' })
  .inputValidator(DashboardRealizedInputSchema)
  .handler(async ({ data }): Promise<DashboardRealizedFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().getDashboardRealized(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
