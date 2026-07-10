/**
 * Server function: APROVAR Plano Orçamentário (`POST /api/v2/budget-plans/:id/approve` — fronteira RPC única
 * §III). Auth NO HANDLER (§ server-fn): sessão + token resolvidos aqui. Zod na borda (§IX). Erro como valor
 * (§V): `{ ok, data | error }` — a UI trata a tag (409 → `budget-plan-already-approved`, 404 → not-found).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { PlanIdInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { LifecyclePlan } from '#modules/budget-plans/server/domain/plan-actions.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type ApproveBudgetPlanFnResult =
  | Readonly<{ ok: true; data: LifecyclePlan }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const approveBudgetPlanFn = createServerFn({ method: 'POST' })
  .inputValidator(PlanIdInputSchema)
  .handler(async ({ data }): Promise<ApproveBudgetPlanFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().approvePlan(data.id, accessToken)
    return isErr(r) ? { ok: false, error: r.error } : { ok: true, data: r.value }
  })
