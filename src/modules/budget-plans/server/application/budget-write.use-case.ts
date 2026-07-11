/**
 * Use-cases de escrita de ORÇAMENTO por rede (#394, Grupo C). Porta = os métodos do client core-api. Erros
 * como valores (§II); sem I/O direto (client injetado). Espelha `write-cost-structure.use-case.ts`.
 */
import type { Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type {
  AddBudgetCommand,
  DeleteBudgetCommand,
  NetworkOption,
} from '#modules/budget-plans/server/domain/plan-detail.io.ts'

export type BudgetWriteClient = Readonly<{
  addBudget: (c: AddBudgetCommand, token: string) => Promise<Result<void, BudgetPlansError>>
  deleteBudget: (c: DeleteBudgetCommand, token: string) => Promise<Result<void, BudgetPlansError>>
  getNetworkOptions: (token: string) => Promise<Result<readonly NetworkOption[], BudgetPlansError>>
}>

type Deps = Readonly<{ client: BudgetWriteClient }>

export const createAddBudget =
  (deps: Deps) =>
  (c: AddBudgetCommand, token: string): Promise<Result<void, BudgetPlansError>> =>
    deps.client.addBudget(c, token)

export const createDeleteBudget =
  (deps: Deps) =>
  (c: DeleteBudgetCommand, token: string): Promise<Result<void, BudgetPlansError>> =>
    deps.client.deleteBudget(c, token)

export const createListNetworkOptions =
  (deps: Deps) =>
  (token: string): Promise<Result<readonly NetworkOption[], BudgetPlansError>> =>
    deps.client.getNetworkOptions(token)
