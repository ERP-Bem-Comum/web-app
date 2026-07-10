/**
 * Use-case: APROVAR um Plano Orçamentário (`POST /:id/approve` — §III, o BFF entrega o comando pronto). Sem
 * body; a resposta é o plano atualizado. Erros como valores (§II): a falha do core trafega como `Result.err`
 * (409 → `budget-plan-already-approved`). O PORT vive aqui (application); o adapter o implementa (§ server).
 */
import type { Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type { LifecyclePlan } from '#modules/budget-plans/server/domain/plan-actions.io.ts'

export type ApproveBudgetPlanClient = Readonly<{
  approvePlan: (id: string, token: string) => Promise<Result<LifecyclePlan, BudgetPlansError>>
}>

export type ApproveBudgetPlanDeps = Readonly<{ client: ApproveBudgetPlanClient }>

export const createApproveBudgetPlan =
  (deps: ApproveBudgetPlanDeps) =>
  (id: string, token: string): Promise<Result<LifecyclePlan, BudgetPlansError>> =>
    deps.client.approvePlan(id, token)
