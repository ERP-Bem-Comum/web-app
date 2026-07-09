/**
 * Composition root da LISTA de Planejamento (BFF). Monta o use-case com o client REAL do core-api. Env lido
 * DENTRO da função (nunca em escopo de módulo). Recurso do MODELO NOVO → `/api/v2/budget-plans` (ADR-0033),
 * base derivada pelo helper único `coreApiBase`.
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createBudgetPlansCoreClient } from './core-api/core-api-budget-plans.ts'
import { createListBudgetPlans } from '#modules/budget-plans/server/application/list-budget-plans.use-case.ts'

type BudgetPlansListServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createBudgetPlansCoreClient(`${coreApiBase(env.CORE_API_URL, 'v2')}/budget-plans`)
  return {
    listBudgetPlans: createListBudgetPlans({ client }),
  }
}

let cached: BudgetPlansListServer | undefined
export const budgetPlansListServer = (): BudgetPlansListServer => (cached ??= build())
