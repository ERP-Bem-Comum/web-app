/**
 * Server function: CRIAR Plano Orçamentário (`POST /api/v2/budget-plans` — fronteira RPC única §III). Auth NO
 * HANDLER (§ server-fn): `createServerFn` é chamável por POST direto, então sessão + token são resolvidos aqui.
 * Zod na borda (§IX). Erro como valor (§V): devolve `{ ok, data | error }` — a UI trata a tag (409 → conflito).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { CreateBudgetPlanInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { CreatedBudgetPlan } from '#modules/budget-plans/server/application/create-budget-plan.use-case.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type CreateBudgetPlanFnResult =
  | Readonly<{ ok: true; data: CreatedBudgetPlan }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const createBudgetPlanFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateBudgetPlanInputSchema)
  .handler(async ({ data }): Promise<CreateBudgetPlanFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().createBudgetPlan(
      { year: data.year, programRef: data.programRef },
      accessToken,
    )
    return isErr(r) ? { ok: false, error: r.error } : { ok: true, data: r.value }
  })
