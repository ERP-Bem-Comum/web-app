/**
 * Use-case: CRIAR CENÁRIO a partir de um plano aprovado (`POST /:id/scenery` — §III). Body `{ name }`; resposta
 * = cenário criado. Erros como valores (§II): 409 → `budget-plan-not-approved` (só planos aprovados geram
 * cenário). O PORT vive aqui (application); o adapter o implementa (§ server).
 */
import type { Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type { CreatedScenery } from '#modules/budget-plans/server/domain/plan-actions.io.ts'

export type CreateSceneryCommand = Readonly<{ id: string; name: string }>

export type CreateSceneryClient = Readonly<{
  createScenery: (
    command: CreateSceneryCommand,
    token: string,
  ) => Promise<Result<CreatedScenery, BudgetPlansError>>
}>

export type CreateSceneryDeps = Readonly<{ client: CreateSceneryClient }>

export const createCreateScenery =
  (deps: CreateSceneryDeps) =>
  (command: CreateSceneryCommand, token: string): Promise<Result<CreatedScenery, BudgetPlansError>> =>
    deps.client.createScenery(command, token)
