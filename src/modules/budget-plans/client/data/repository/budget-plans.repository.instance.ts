/**
 * Instância da BudgetPlansRepository — wire das server functions reais (import direto de server/adapters —
 * boundary §I/§III). Espelha `reconciliation.repository.instance.ts`.
 */
import { listBudgetPlansFn } from '#modules/budget-plans/server/adapters/server-fns/list-budget-plans.query.fn.ts'
import { createBudgetPlanFn } from '#modules/budget-plans/server/adapters/server-fns/create-budget-plan.service.fn.ts'
import { listBudgetPlanOptionsFn } from '#modules/budget-plans/server/adapters/server-fns/list-budget-plan-options.query.fn.ts'
import { getBudgetPlanDetailFn } from '#modules/budget-plans/server/adapters/server-fns/get-budget-plan-detail.query.fn.ts'

import { createBudgetPlansRepository } from './budget-plans.repository.ts'

export const budgetPlansRepository = createBudgetPlansRepository({
  listBudgetPlansFn: (opts) => listBudgetPlansFn(opts),
  createBudgetPlanFn: (opts) => createBudgetPlanFn(opts),
  listBudgetPlanOptionsFn: () => listBudgetPlanOptionsFn(),
  getBudgetPlanDetailFn: (opts) => getBudgetPlanDetailFn(opts),
})
