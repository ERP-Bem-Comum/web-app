/**
 * Instância da BudgetPlansRepository — wire das server functions reais (import direto de server/adapters —
 * boundary §I/§III). Espelha `reconciliation.repository.instance.ts`.
 */
import { listBudgetPlansFn } from '#modules/budget-plans/server/adapters/server-fns/list-budget-plans.query.fn.ts'
import { createBudgetPlanFn } from '#modules/budget-plans/server/adapters/server-fns/create-budget-plan.service.fn.ts'
import { listBudgetPlanOptionsFn } from '#modules/budget-plans/server/adapters/server-fns/list-budget-plan-options.query.fn.ts'
import { getBudgetPlanDetailFn } from '#modules/budget-plans/server/adapters/server-fns/get-budget-plan-detail.query.fn.ts'
import { getBudgetGridFn } from '#modules/budget-plans/server/adapters/server-fns/get-budget-grid.query.fn.ts'
import { approveBudgetPlanFn } from '#modules/budget-plans/server/adapters/server-fns/approve-budget-plan.service.fn.ts'
import { deleteBudgetPlanFn } from '#modules/budget-plans/server/adapters/server-fns/delete-budget-plan.service.fn.ts'
import { startCalibrationFn } from '#modules/budget-plans/server/adapters/server-fns/start-calibration.service.fn.ts'
import { createSceneryFn } from '#modules/budget-plans/server/adapters/server-fns/create-scenery.service.fn.ts'
import { exportBudgetPlanCsvFn } from '#modules/budget-plans/server/adapters/server-fns/export-budget-plan-csv.query.fn.ts'
import { getBudgetPlanInsightsFn } from '#modules/budget-plans/server/adapters/server-fns/get-budget-plan-insights.query.fn.ts'
import { addCostCenterFn } from '#modules/budget-plans/server/adapters/server-fns/add-cost-center.service.fn.ts'
import { addCategoryFn } from '#modules/budget-plans/server/adapters/server-fns/add-category.service.fn.ts'
import { addSubcategoryFn } from '#modules/budget-plans/server/adapters/server-fns/add-subcategory.service.fn.ts'
import { addBudgetFn } from '#modules/budget-plans/server/adapters/server-fns/add-budget.service.fn.ts'
import { deleteBudgetFn } from '#modules/budget-plans/server/adapters/server-fns/delete-budget.service.fn.ts'
import { listNetworkOptionsFn } from '#modules/budget-plans/server/adapters/server-fns/list-network-options.query.fn.ts'
import { postBudgetResultFn } from '#modules/budget-plans/server/adapters/server-fns/post-budget-result.service.fn.ts'
import { getConsolidadoAbcFn } from '#modules/budget-plans/server/adapters/server-fns/get-consolidado-abc.query.fn.ts'

import { createBudgetPlansRepository } from './budget-plans.repository.ts'

export const budgetPlansRepository = createBudgetPlansRepository({
  listBudgetPlansFn: (opts) => listBudgetPlansFn(opts),
  createBudgetPlanFn: (opts) => createBudgetPlanFn(opts),
  listBudgetPlanOptionsFn: () => listBudgetPlanOptionsFn(),
  getBudgetPlanDetailFn: (opts) => getBudgetPlanDetailFn(opts),
  getBudgetGridFn: (opts) => getBudgetGridFn(opts),
  approveBudgetPlanFn: (opts) => approveBudgetPlanFn(opts),
  deleteBudgetPlanFn: (opts) => deleteBudgetPlanFn(opts),
  startCalibrationFn: (opts) => startCalibrationFn(opts),
  createSceneryFn: (opts) => createSceneryFn(opts),
  exportBudgetPlanCsvFn: (opts) => exportBudgetPlanCsvFn(opts),
  getBudgetPlanInsightsFn: (opts) => getBudgetPlanInsightsFn(opts),
  addCostCenterFn: (opts) => addCostCenterFn(opts),
  addCategoryFn: (opts) => addCategoryFn(opts),
  addSubcategoryFn: (opts) => addSubcategoryFn(opts),
  addBudgetFn: (opts) => addBudgetFn(opts),
  deleteBudgetFn: (opts) => deleteBudgetFn(opts),
  networkOptionsFn: () => listNetworkOptionsFn(),
  postBudgetResultFn: (opts) => postBudgetResultFn(opts),
  getConsolidadoFn: (opts) => getConsolidadoAbcFn(opts),
})
