/**
 * Server function: DETALHE do Plano Orçamentário (fronteira RPC única — §III). O BFF compõe os 2 GETs do
 * core-api (`/:id` + `/:id/cost-structure`) e entrega o `PlanDetail` PRONTO. Auth NO HANDLER (§ server-fn):
 * `createServerFn` é chamável por POST direto, então sessão + token são resolvidos aqui, não só no `beforeLoad`.
 * Zod na borda (§IX). Erro como valor (§V): devolve `{ ok, data | error }` — a UI trata a tag (404 → not-found).
 */
import { createServerFn } from '@tanstack/react-start'

import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { GetBudgetPlanDetailInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { PlanDetailComposed } from '#modules/budget-plans/server/domain/plan-detail.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type GetBudgetPlanDetailFnResult =
  | Readonly<{ ok: true; data: PlanDetailComposed }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const getBudgetPlanDetailFn = createServerFn({ method: 'GET' })
  .inputValidator(GetBudgetPlanDetailInputSchema)
  .handler(async ({ data }): Promise<GetBudgetPlanDetailFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().getPlanDetail(data.id, accessToken)
    return r.ok ? { ok: true, data: r.value } : { ok: false, error: r.error }
  })
