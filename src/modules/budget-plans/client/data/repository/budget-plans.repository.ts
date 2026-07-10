/**
 * BudgetPlansRepository — porta do client para o BFF do Plano Orçamentário. Converte `{ ok, data|error }` →
 * `Result` (§II). Tipos do próprio `data/model`; erro do `budget-plans-error.ts` neutro (§I). Fns injetadas
 * (testável). Espelha `reconciliation.repository.ts`.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  BudgetPlanNode,
  BudgetPlanProgramOption,
  CreateBudgetPlanInput,
  CreatedBudgetPlan,
} from '#modules/budget-plans/client/data/model/budget-plan.model.ts'
import type { PlanDetail } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import type {
  LifecyclePlan,
  CreatedScenery,
  BudgetPlanInsights,
  BudgetPlanCsvFile,
} from '#modules/budget-plans/client/data/model/plan-actions.model.ts'
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
type CreateFn = (opts: { data: CreateBudgetPlanInput }) => Promise<BudgetPlansFnResult<CreatedBudgetPlan>>
type OptionsFn = () => Promise<BudgetPlansFnResult<{ programs: readonly BudgetPlanProgramOption[] }>>
type GetDetailFn = (opts: { data: { id: string } }) => Promise<BudgetPlansFnResult<PlanDetail>>
type PlanIdFn<T> = (opts: { data: { id: string } }) => Promise<BudgetPlansFnResult<T>>
type CreateSceneryFn = (opts: {
  data: { id: string; name: string }
}) => Promise<BudgetPlansFnResult<CreatedScenery>>

export type BudgetPlansRepository = Readonly<{
  listBudgetPlans: (args: ListBudgetPlansArgs) => Promise<Result<BudgetPlanListPageResult, BudgetPlansError>>
  create: (input: CreateBudgetPlanInput) => Promise<Result<CreatedBudgetPlan, BudgetPlansError>>
  getProgramOptions: () => Promise<Result<readonly BudgetPlanProgramOption[], BudgetPlansError>>
  getPlanDetail: (id: string) => Promise<Result<PlanDetail, BudgetPlansError>>
  approvePlan: (id: string) => Promise<Result<LifecyclePlan, BudgetPlansError>>
  startCalibration: (id: string) => Promise<Result<LifecyclePlan, BudgetPlansError>>
  createScenery: (id: string, name: string) => Promise<Result<CreatedScenery, BudgetPlansError>>
  exportPlanCsv: (id: string) => Promise<Result<BudgetPlanCsvFile, BudgetPlansError>>
  getInsights: (id: string) => Promise<Result<BudgetPlanInsights, BudgetPlansError>>
}>

export const createBudgetPlansRepository = (
  deps: Readonly<{
    listBudgetPlansFn: ListFn
    createBudgetPlanFn: CreateFn
    listBudgetPlanOptionsFn: OptionsFn
    getBudgetPlanDetailFn: GetDetailFn
    approveBudgetPlanFn: PlanIdFn<LifecyclePlan>
    startCalibrationFn: PlanIdFn<LifecyclePlan>
    createSceneryFn: CreateSceneryFn
    exportBudgetPlanCsvFn: PlanIdFn<BudgetPlanCsvFile>
    getBudgetPlanInsightsFn: PlanIdFn<BudgetPlanInsights>
  }>,
): BudgetPlansRepository => ({
  listBudgetPlans: async (args) => {
    const res = await deps.listBudgetPlansFn({ data: args })
    return res.ok ? ok(res.data) : err(res.error)
  },
  create: async (input) => {
    const res = await deps.createBudgetPlanFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getProgramOptions: async () => {
    const res = await deps.listBudgetPlanOptionsFn()
    return res.ok ? ok(res.data.programs) : err(res.error)
  },
  getPlanDetail: async (id) => {
    const res = await deps.getBudgetPlanDetailFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  approvePlan: async (id) => {
    const res = await deps.approveBudgetPlanFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  startCalibration: async (id) => {
    const res = await deps.startCalibrationFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  createScenery: async (id, name) => {
    const res = await deps.createSceneryFn({ data: { id, name } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  exportPlanCsv: async (id) => {
    const res = await deps.exportBudgetPlanCsvFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  getInsights: async (id) => {
    const res = await deps.getBudgetPlanInsightsFn({ data: { id } })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
