/**
 * Use-case: CRIAR um Plano Orçamentário (§III: o BFF entrega o comando pronto por caso de uso). Um único
 * `POST /budget-plans` — a unicidade ano+programa é do backend (409 → `budget-plan-already-exists`), NÃO do
 * client. Erros como valores (§II): a falha do core-api trafega como `Result.err` (sem `throw`).
 *
 * Dependência aponta para dentro (§ server): o PORT (`CreateBudgetPlanClient`) vive AQUI (application); o
 * adapter o implementa e mapeia o DTO/status do core. O use-case não conhece o schema nem o HTTP do core.
 */
import type { Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type { BudgetPlanStatus } from '#modules/budget-plans/server/domain/planejamento-list.io.ts'

/** Comando de criação (contrato real do core: ano inteiro + `programRef` do catálogo do budget-plans). */
export type CreateBudgetPlanCommand = Readonly<{ year: number; programRef: string }>

/** Plano recém-criado (resposta 201 do core). `version` chega string; o front só precisa saber que persistiu. */
export type CreatedBudgetPlan = Readonly<{
  id: string
  year: number
  programRef: string
  status: BudgetPlanStatus
  version: string
  totalInCents: number
}>

export type CreateBudgetPlanClient = Readonly<{
  createBudgetPlan: (
    command: CreateBudgetPlanCommand,
    token: string,
  ) => Promise<Result<CreatedBudgetPlan, BudgetPlansError>>
}>

export type CreateBudgetPlanDeps = Readonly<{ client: CreateBudgetPlanClient }>

export const createCreateBudgetPlan =
  (deps: CreateBudgetPlanDeps) =>
  (command: CreateBudgetPlanCommand, token: string): Promise<Result<CreatedBudgetPlan, BudgetPlansError>> =>
    deps.client.createBudgetPlan(command, token)
