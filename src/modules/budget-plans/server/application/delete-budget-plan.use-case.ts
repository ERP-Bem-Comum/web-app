/**
 * Use-case: EXCLUIR um Plano Orçamentário (`DELETE /budget-plans/:id` — §III, feature 076 / core-api #453).
 * Sem body; 204 sem resposta. Erros como valores (§II): a falha do core trafega como `Result.err`.
 * O PORT vive aqui (application); o adapter o implementa (§ server).
 *
 * O core apaga, na MESMA transação, o plano + seus orçamentos + seus lançamentos (`bgp_budget_results` não tem
 * FK, então um DELETE ingênuo deixaria lançamento órfão). NÃO há cascata de PLANOS: plano com filho é recusado
 * com 409 — apaga-se de baixo pra cima. Plano APROVADO também é recusado (imutável). Ver `budget-plans.errors`.
 */
import type { Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type DeleteBudgetPlanClient = Readonly<{
  deletePlan: (id: string, token: string) => Promise<Result<void, BudgetPlansError>>
}>

export type DeleteBudgetPlanDeps = Readonly<{ client: DeleteBudgetPlanClient }>

export const createDeleteBudgetPlan =
  (deps: DeleteBudgetPlanDeps) =>
  (id: string, token: string): Promise<Result<void, BudgetPlansError>> =>
    deps.client.deletePlan(id, token)
