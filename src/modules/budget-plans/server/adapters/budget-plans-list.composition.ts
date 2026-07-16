/**
 * Composition root do Plano Orçamentário (BFF). Monta os use-cases com o client REAL do core-api (um único
 * client atende lista, criação e options — mesmo `baseUrl`). Env lido DENTRO da função (nunca em escopo de
 * módulo). Recurso do MODELO NOVO → `/api/v2/budget-plans` (ADR-0033), base pelo helper único `coreApiBase`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { getUserFn } from '#modules/users/public-api/index.ts'
import { createBudgetPlansCoreClient } from './core-api/core-api-budget-plans.ts'
import {
  createListBudgetPlans,
  type ResolveUserNames,
} from '#modules/budget-plans/server/application/list-budget-plans.use-case.ts'
import { createCreateBudgetPlan } from '#modules/budget-plans/server/application/create-budget-plan.use-case.ts'
import { createListBudgetPlanOptions } from '#modules/budget-plans/server/application/list-budget-plan-options.use-case.ts'
import { createGetBudgetPlanDetail } from '#modules/budget-plans/server/application/get-budget-plan-detail.use-case.ts'
import { createGetBudgetGrid } from '#modules/budget-plans/server/application/get-budget-grid.use-case.ts'
import { createApproveBudgetPlan } from '#modules/budget-plans/server/application/approve-budget-plan.use-case.ts'
import { createDeleteBudgetPlan } from '#modules/budget-plans/server/application/delete-budget-plan.use-case.ts'
import { createStartCalibration } from '#modules/budget-plans/server/application/start-calibration.use-case.ts'
import { createCreateScenery } from '#modules/budget-plans/server/application/create-scenery.use-case.ts'
import { createExportBudgetPlanCsv } from '#modules/budget-plans/server/application/export-budget-plan-csv.use-case.ts'
import { createGetBudgetPlanInsights } from '#modules/budget-plans/server/application/get-budget-plan-insights.use-case.ts'
import {
  createAddCostCenter,
  createAddCategory,
  createAddSubcategory,
} from '#modules/budget-plans/server/application/write-cost-structure.use-case.ts'
import {
  createAddBudget,
  createDeleteBudget,
  createListNetworkOptions,
  createPostBudgetResult,
} from '#modules/budget-plans/server/application/budget-write.use-case.ts'
import { createGetConsolidadoAbc } from '#modules/budget-plans/server/application/get-consolidado-abc.use-case.ts'
import { createExportConsolidadoAbcCsv } from '#modules/budget-plans/server/application/export-consolidado-abc-csv.use-case.ts'

type BudgetPlansServer = ReturnType<typeof build>

// #373: resolve refs de autor → nome cruzando o módulo users (getUserFn). Best-effort e por ref: falha/não
// encontrado → ausente do mapa (o use-case cai em `updatedByName: null`). Refs já vêm deduplicados.
const resolveUserNames: ResolveUserNames = async (refs) => {
  const entries = await Promise.all(
    refs.map(async (ref): Promise<readonly [string, string] | null> => {
      const u = await getUserFn({ data: { id: ref } })
      return u.ok ? [ref, u.data.name] : null
    }),
  )
  return new Map(entries.filter((e): e is readonly [string, string] => e !== null))
}

const build = () => {
  const env = loadEnvOrThrow()
  const client = createBudgetPlansCoreClient(`${coreApiBase(env.CORE_API_URL, 'v2')}/budget-plans`)
  return {
    listBudgetPlans: createListBudgetPlans({ client, resolveUserNames }),
    createBudgetPlan: createCreateBudgetPlan({ client }),
    listProgramOptions: createListBudgetPlanOptions({ client }),
    getPlanDetail: createGetBudgetPlanDetail({ client }),
    getBudgetGrid: createGetBudgetGrid({ client }),
    approvePlan: createApproveBudgetPlan({ client }),
    deletePlan: createDeleteBudgetPlan({ client }),
    startCalibration: createStartCalibration({ client }),
    createScenery: createCreateScenery({ client }),
    exportPlanCsv: createExportBudgetPlanCsv({ client }),
    getInsights: createGetBudgetPlanInsights({ client }),
    addCostCenter: createAddCostCenter({ client }),
    addCategory: createAddCategory({ client }),
    addSubcategory: createAddSubcategory({ client }),
    addBudget: createAddBudget({ client }),
    deleteBudget: createDeleteBudget({ client }),
    listNetworkOptions: createListNetworkOptions({ client }),
    postBudgetResult: createPostBudgetResult({ client }),
    getConsolidado: createGetConsolidadoAbc({ client }),
    exportConsolidadoCsv: createExportConsolidadoAbcCsv({ client }),
  }
}

let cached: BudgetPlansServer | undefined
export const budgetPlansServer = (): BudgetPlansServer => (cached ??= build())
