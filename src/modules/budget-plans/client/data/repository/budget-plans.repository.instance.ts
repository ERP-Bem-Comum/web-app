/**
 * Instância da BudgetPlansRepository — wire da server function real (import direto de server/adapters —
 * boundary §I/§III). Espelha `reconciliation.repository.instance.ts`.
 */
import { listBudgetPlansFn } from '#modules/budget-plans/server/adapters/server-fns/list-budget-plans.query.fn.ts'

import { createBudgetPlansRepository } from './budget-plans.repository.ts'

export const budgetPlansRepository = createBudgetPlansRepository({
  listBudgetPlansFn: (opts) => listBudgetPlansFn(opts),
})
