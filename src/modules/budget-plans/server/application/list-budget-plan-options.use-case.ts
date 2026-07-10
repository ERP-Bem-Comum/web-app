/**
 * Use-case: opções do CATÁLOGO de programas do Plano Orçamentário (`GET /budget-plans/options`). Fonte do
 * `programRef` real para o dropdown do "Adicionar Plano" (§III). O catálogo é próprio do budget-plans (NÃO
 * é o módulo `programs`). Erros como valores (§II): falha do core-api → `Result.err`.
 *
 * Reusa o tipo cru `RawProgramOption` (application-owned) já declarado no use-case da lista.
 */
import type { Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type { RawProgramOption } from '#modules/budget-plans/server/application/list-budget-plans.use-case.ts'

export type BudgetPlanOptionsClient = Readonly<{
  getProgramOptions: (token: string) => Promise<Result<readonly RawProgramOption[], BudgetPlansError>>
}>

export type ListBudgetPlanOptionsDeps = Readonly<{ client: BudgetPlanOptionsClient }>

export const createListBudgetPlanOptions =
  (deps: ListBudgetPlanOptionsDeps) =>
  (token: string): Promise<Result<readonly RawProgramOption[], BudgetPlansError>> =>
    deps.client.getProgramOptions(token)
