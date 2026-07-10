/**
 * Composition root do Plano Orçamentário (BFF). Monta os use-cases com o client REAL do core-api (um único
 * client atende lista, criação e options — mesmo `baseUrl`). Env lido DENTRO da função (nunca em escopo de
 * módulo). Recurso do MODELO NOVO → `/api/v2/budget-plans` (ADR-0033), base pelo helper único `coreApiBase`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createBudgetPlansCoreClient } from './core-api/core-api-budget-plans.ts'
import { createListBudgetPlans } from '#modules/budget-plans/server/application/list-budget-plans.use-case.ts'
import { createCreateBudgetPlan } from '#modules/budget-plans/server/application/create-budget-plan.use-case.ts'
import { createListBudgetPlanOptions } from '#modules/budget-plans/server/application/list-budget-plan-options.use-case.ts'

type BudgetPlansServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createBudgetPlansCoreClient(`${coreApiBase(env.CORE_API_URL, 'v2')}/budget-plans`)
  return {
    listBudgetPlans: createListBudgetPlans({ client }),
    createBudgetPlan: createCreateBudgetPlan({ client }),
    listProgramOptions: createListBudgetPlanOptions({ client }),
  }
}

let cached: BudgetPlansServer | undefined
export const budgetPlansServer = (): BudgetPlansServer => (cached ??= build())
