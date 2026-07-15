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
import type {
  PlanDetail,
  BudgetGrid,
  AddCostCenterInput,
  AddCategoryInput,
  AddSubcategoryInput,
  CostStructureTree,
} from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import type {
  LifecyclePlan,
  CreatedScenery,
  BudgetPlanInsights,
  BudgetPlanCsvFile,
} from '#modules/budget-plans/client/data/model/plan-actions.model.ts'
import type { ConsolidatedAbc } from '#modules/budget-plans/client/data/model/consolidado-abc.model.ts'
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
type GetBudgetGridFn = (opts: {
  data: { planId: string; networkRef: string }
}) => Promise<BudgetPlansFnResult<BudgetGrid>>
type PlanIdFn<T> = (opts: { data: { id: string } }) => Promise<BudgetPlansFnResult<T>>
type CreateSceneryFn = (opts: {
  data: { id: string; name: string }
}) => Promise<BudgetPlansFnResult<CreatedScenery>>
type AddCostCenterFn = (opts: {
  data: { planId: string; name: string; direction: AddCostCenterInput['direction'] }
}) => Promise<BudgetPlansFnResult<CostStructureTree>>
type AddCategoryFn = (opts: {
  data: { planId: string; costCenterId: string; name: string }
}) => Promise<BudgetPlansFnResult<CostStructureTree>>
type AddSubcategoryFn = (opts: {
  data: { planId: string; categoryId: string; name: string; launchType: AddSubcategoryInput['launchType'] }
}) => Promise<BudgetPlansFnResult<CostStructureTree>>
// #394 (Grupo C): orçamento por rede. `NetworkKind` = state|municipality; ref = UF/IBGE.
export type BudgetNetworkKind = 'state' | 'municipality'
export type BudgetNetworkOption = Readonly<{ ref: string; name: string; kind: BudgetNetworkKind }>
type WriteVoidResult = Readonly<{ ok: true }> | Readonly<{ ok: false; error: BudgetPlansError }>
type AddBudgetFn = (opts: {
  data: { planId: string; partnerKind: BudgetNetworkKind; partnerRef: string; valueInCents: number }
}) => Promise<WriteVoidResult>
type DeleteBudgetFn = (opts: { data: { planId: string; budgetId: string } }) => Promise<WriteVoidResult>
type NetworkOptionsFn = () => Promise<readonly BudgetNetworkOption[]>
export type IpcaResultArgs = Readonly<{
  planId: string
  budgetId: string
  subcategoryId: string
  baseValueInCents: number
  ipca: number
}>
type PostIpcaFn = (opts: { data: IpcaResultArgs }) => Promise<WriteVoidResult>

/** Filtro do Consolidado ABC: Ano Base (obrigatório) + Programa (uuid opcional). */
export type ConsolidadoFilters = Readonly<{ year: number; programRef?: string }>
type GetConsolidadoFn = (opts: {
  data: { year: number; programRef?: string }
}) => Promise<BudgetPlansFnResult<ConsolidatedAbc>>

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
  addCostCenter: (input: AddCostCenterInput) => Promise<Result<CostStructureTree, BudgetPlansError>>
  addCategory: (input: AddCategoryInput) => Promise<Result<CostStructureTree, BudgetPlansError>>
  addSubcategory: (input: AddSubcategoryInput) => Promise<Result<CostStructureTree, BudgetPlansError>>
  addBudget: (input: {
    planId: string
    partnerKind: BudgetNetworkKind
    partnerRef: string
    valueInCents: number
  }) => Promise<Result<void, BudgetPlansError>>
  deleteBudget: (input: { planId: string; budgetId: string }) => Promise<Result<void, BudgetPlansError>>
  getNetworkOptions: () => Promise<readonly BudgetNetworkOption[]>
  postIpcaResult: (input: IpcaResultArgs) => Promise<Result<void, BudgetPlansError>>
  getConsolidado: (filters: ConsolidadoFilters) => Promise<Result<ConsolidatedAbc, BudgetPlansError>>
  /** §1.7 — a matriz Categorias × 12 meses de UMA rede, endereçada pela `ref` (UF) que está na URL. */
  getBudgetGrid: (planId: string, networkRef: string) => Promise<Result<BudgetGrid, BudgetPlansError>>
}>

export const createBudgetPlansRepository = (
  deps: Readonly<{
    listBudgetPlansFn: ListFn
    createBudgetPlanFn: CreateFn
    listBudgetPlanOptionsFn: OptionsFn
    getBudgetPlanDetailFn: GetDetailFn
    getBudgetGridFn: GetBudgetGridFn
    approveBudgetPlanFn: PlanIdFn<LifecyclePlan>
    startCalibrationFn: PlanIdFn<LifecyclePlan>
    createSceneryFn: CreateSceneryFn
    exportBudgetPlanCsvFn: PlanIdFn<BudgetPlanCsvFile>
    getBudgetPlanInsightsFn: PlanIdFn<BudgetPlanInsights>
    addCostCenterFn: AddCostCenterFn
    addCategoryFn: AddCategoryFn
    addSubcategoryFn: AddSubcategoryFn
    addBudgetFn: AddBudgetFn
    deleteBudgetFn: DeleteBudgetFn
    networkOptionsFn: NetworkOptionsFn
    postIpcaResultFn: PostIpcaFn
    getConsolidadoFn: GetConsolidadoFn
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
  getBudgetGrid: async (planId, networkRef) => {
    const res = await deps.getBudgetGridFn({ data: { planId, networkRef } })
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
  addCostCenter: async (input) => {
    const res = await deps.addCostCenterFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  addCategory: async (input) => {
    const res = await deps.addCategoryFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  addSubcategory: async (input) => {
    const res = await deps.addSubcategoryFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  addBudget: async (input) => {
    const res = await deps.addBudgetFn({ data: input })
    return res.ok ? ok(undefined) : err(res.error)
  },
  deleteBudget: async (input) => {
    const res = await deps.deleteBudgetFn({ data: input })
    return res.ok ? ok(undefined) : err(res.error)
  },
  getNetworkOptions: () => deps.networkOptionsFn(),
  postIpcaResult: async (input) => {
    const res = await deps.postIpcaResultFn({ data: input })
    return res.ok ? ok(undefined) : err(res.error)
  },
  getConsolidado: async (filters) => {
    const res = await deps.getConsolidadoFn({ data: { year: filters.year, programRef: filters.programRef } })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
