/**
 * Use-case (application) — export CSV do Consolidado ABC. Orquestra: obtém o consolidado da FONTE injetada,
 * serializa no domínio (puro) e entrega `{ filename, content }` como `Result` (§II sem throw). O CSV é
 * gerado 100% server-side (Decisão 11 da P.O.): o client só baixa o artefato.
 *
 * A `source` é injetada pela composition (hoje o placeholder; amanhã o core-api) — o use-case não muda.
 */
import { ok, type Result } from '#shared/primitives/result.ts'

import { consolidatedAbcToCsv } from '#modules/budget-plans/server/domain/consolidado-abc.serializer.ts'
import type {
  ConsolidatedAbc,
  ConsolidatedAbcCsv,
} from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type ExportConsolidadoAbcInput = Readonly<{ year: number; programs: readonly string[] }>

export type ExportConsolidadoAbcDeps = Readonly<{
  /** Fonte do consolidado (planos APROVADOS por Ano × Programa). Placeholder hoje; core-api depois. */
  source: (input: ExportConsolidadoAbcInput) => ConsolidatedAbc
}>

export const createExportConsolidadoAbcCsv =
  (deps: ExportConsolidadoAbcDeps) =>
  (input: ExportConsolidadoAbcInput): Result<ConsolidatedAbcCsv, BudgetPlansError> => {
    const consolidado = deps.source(input)
    const content = consolidatedAbcToCsv(consolidado)
    const filename = `consolidado-abc-${String(input.year)}.csv`
    return ok({ filename, content })
  }
