/**
 * Use-case (application) — LEITURA do Consolidado ABC. Delega ao PORT do core-api (`getConsolidatedResult`)
 * que já devolve `ConsolidatedAbc` validado (§II sem throw). O token é resolvido na server fn e injetado.
 */
import type { Result } from '#shared/primitives/result.ts'

import type { ConsolidatedAbc } from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

/** Filtro do relatório: Ano Base (obrigatório) + Programa (uuid opcional). */
export type ConsolidatedResultParams = Readonly<{ year: number; programRef?: string }>

export type GetConsolidadoAbcClient = Readonly<{
  getConsolidatedResult: (
    params: ConsolidatedResultParams,
    token: string,
  ) => Promise<Result<ConsolidatedAbc, BudgetPlansError>>
}>

export type GetConsolidadoAbcDeps = Readonly<{ client: GetConsolidadoAbcClient }>

export const createGetConsolidadoAbc =
  (deps: GetConsolidadoAbcDeps) =>
  (input: ConsolidatedResultParams, token: string): Promise<Result<ConsolidatedAbc, BudgetPlansError>> =>
    deps.client.getConsolidatedResult(input, token)
