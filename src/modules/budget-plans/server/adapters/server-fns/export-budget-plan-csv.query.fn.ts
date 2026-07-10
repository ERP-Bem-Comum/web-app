/**
 * Server function: exportar o Plano Orçamentário em CSV (`GET /api/v2/budget-plans/:id/generate-csv` —
 * fronteira RPC única §III). O CSV vem PRONTO do core-api (text/csv); o BFF busca os bytes e nomeia o arquivo,
 * o client só dispara o download. Auth NO HANDLER (§ server-fn). Zod na borda (§IX). Erro como valor (§V).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { PlanIdInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { BudgetPlanCsv } from '#modules/budget-plans/server/domain/plan-actions.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type ExportBudgetPlanCsvFnResult =
  | Readonly<{ ok: true; data: BudgetPlanCsv }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const exportBudgetPlanCsvFn = createServerFn({ method: 'GET' })
  .inputValidator(PlanIdInputSchema)
  .handler(async ({ data }): Promise<ExportBudgetPlanCsvFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().exportPlanCsv(data.id, accessToken)
    return isErr(r) ? { ok: false, error: r.error } : { ok: true, data: r.value }
  })
