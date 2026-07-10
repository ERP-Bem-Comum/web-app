/**
 * Use-case: INSIGHTS do Plano Orçamentário (`GET /:id/insights` — §III). O BFF entrega o comparativo PRONTO
 * (ano atual × anteriores). Erros como valores (§II): 404 → `budget-plan-not-found`. O PORT vive aqui
 * (application); o adapter o implementa e mapeia o DTO/status do core (§ server).
 */
import type { Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type { BudgetPlanInsights } from '#modules/budget-plans/server/domain/plan-actions.io.ts'

export type GetBudgetPlanInsightsClient = Readonly<{
  getInsights: (id: string, token: string) => Promise<Result<BudgetPlanInsights, BudgetPlansError>>
}>

export type GetBudgetPlanInsightsDeps = Readonly<{ client: GetBudgetPlanInsightsClient }>

export const createGetBudgetPlanInsights =
  (deps: GetBudgetPlanInsightsDeps) =>
  (id: string, token: string): Promise<Result<BudgetPlanInsights, BudgetPlansError>> =>
    deps.client.getInsights(id, token)
