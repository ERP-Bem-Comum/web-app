/**
 * BudgetPlansRepository — porta do client para o BFF do Plano Orçamentário. Converte `{ ok, data|error }` →
 * `Result` (§II). Tipos do próprio `data/model`; erro do `budget-plans-error.ts` neutro (§I). Fn injetada
 * (testável). Espelha `reconciliation.repository.ts`.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { BudgetPlanNode } from '#modules/budget-plans/client/data/model/budget-plan.model.ts'
import type {
  BudgetPlansError,
  BudgetPlansFnResult,
} from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'

/** Página da lista entregue pelo BFF (itens já na forma `BudgetPlanNode` + total). */
export type BudgetPlanListPageResult = Readonly<{
  items: readonly BudgetPlanNode[]
  total: number
}>

export type ListBudgetPlansArgs = Readonly<{
  page: number
  limit: number
  year?: number
  status?: BudgetPlanNode['status']
}>

type ListFn = (opts: { data: ListBudgetPlansArgs }) => Promise<BudgetPlansFnResult<BudgetPlanListPageResult>>

export type BudgetPlansRepository = Readonly<{
  listBudgetPlans: (args: ListBudgetPlansArgs) => Promise<Result<BudgetPlanListPageResult, BudgetPlansError>>
}>

export const createBudgetPlansRepository = (
  deps: Readonly<{ listBudgetPlansFn: ListFn }>,
): BudgetPlansRepository => ({
  listBudgetPlans: async (args) => {
    const res = await deps.listBudgetPlansFn({ data: args })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
