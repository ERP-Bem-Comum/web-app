/**
 * Server function: INSIGHTS do Plano Orçamentário (`GET /api/v2/budget-plans/:id/insights` — fronteira RPC
 * única §III). O BFF entrega o comparativo PRONTO (ano atual × anteriores). Auth NO HANDLER (§ server-fn). Zod
 * na borda (§IX). Erro como valor (§V): a UI trata a tag (404 → not-found).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { PlanIdInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { BudgetPlanInsights } from '#modules/budget-plans/server/domain/plan-actions.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type GetBudgetPlanInsightsFnResult =
  | Readonly<{ ok: true; data: BudgetPlanInsights }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const getBudgetPlanInsightsFn = createServerFn({ method: 'GET' })
  .inputValidator(PlanIdInputSchema)
  .handler(async ({ data }): Promise<GetBudgetPlanInsightsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().getInsights(data.id, accessToken)
    return isErr(r) ? { ok: false, error: r.error } : { ok: true, data: r.value }
  })
