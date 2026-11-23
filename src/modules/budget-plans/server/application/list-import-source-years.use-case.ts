/**
 * Use-case: anos de ORIGEM do "Criar a partir do ano de" (spec 134 — core-api#1092). O core copia a ÚLTIMA VERSÃO
 * APROVADA do plano de um ano+programa, então só faz sentido oferecer os anos em que o programa TEM plano
 * aprovado. O BFF entrega a lista pronta (§III): anos distintos, do mais recente para o mais antigo.
 *
 * O PORT (`ImportSourceYearsClient`) vive aqui (application); o adapter faz o `GET /budget-plans?status=APROVADO
 * &programRef=` e devolve os anos crus (pode repetir: original + calibrações aprovadas do mesmo ano).
 */
import { ok, isErr, type Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type ImportSourceYearsClient = Readonly<{
  listApprovedPlanYears: (
    programRef: string,
    token: string,
  ) => Promise<Result<readonly number[], BudgetPlansError>>
}>

export type ListImportSourceYearsDeps = Readonly<{ client: ImportSourceYearsClient }>

/** Anos distintos, do mais recente para o mais antigo (o ano anterior costuma ser a origem). */
export const distinctYearsDesc = (years: readonly number[]): readonly number[] =>
  [...new Set(years)].sort((a, b) => b - a)

export const createListImportSourceYears =
  (deps: ListImportSourceYearsDeps) =>
  async (programRef: string, token: string): Promise<Result<readonly number[], BudgetPlansError>> => {
    const r = await deps.client.listApprovedPlanYears(programRef, token)
    return isErr(r) ? r : ok(distinctYearsDesc(r.value))
  }
