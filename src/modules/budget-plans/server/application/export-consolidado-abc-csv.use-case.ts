/**
 * Use-case (application) — export CSV do Consolidado ABC. O core-api agora é o dono do relatório e expõe
 * `GET /budget-plans/consolidated-result/csv`: o BFF apenas PROXYA o CSV pronto do core e o nomeia
 * (`consolidado-abc-{ano}.csv`), entregando `{ filename, content }` como `Result` (§II sem throw). O client
 * só baixa o artefato. (Antes o BFF serializava o CSV localmente — front-first; a fonte real assume agora.)
 */
import { ok, isErr, type Result } from '#shared/primitives/result.ts'

import type { ConsolidatedAbcCsv } from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'
import type { ConsolidatedResultParams } from '#modules/budget-plans/server/application/get-consolidado-abc.use-case.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type ExportConsolidadoAbcCsvClient = Readonly<{
  getConsolidatedResultCsv: (
    params: ConsolidatedResultParams,
    token: string,
  ) => Promise<Result<string, BudgetPlansError>>
}>

export type ExportConsolidadoAbcDeps = Readonly<{ client: ExportConsolidadoAbcCsvClient }>

export const createExportConsolidadoAbcCsv =
  (deps: ExportConsolidadoAbcDeps) =>
  async (
    input: ConsolidatedResultParams,
    token: string,
  ): Promise<Result<ConsolidatedAbcCsv, BudgetPlansError>> => {
    const r = await deps.client.getConsolidatedResultCsv(input, token)
    if (isErr(r)) return r
    return ok({ filename: `consolidado-abc-${String(input.year)}.csv`, content: r.value })
  }
