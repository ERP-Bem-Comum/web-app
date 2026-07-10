/**
 * Use-case: EXPORTAR o Plano Orçamentário em CSV (`GET /:id/generate-csv` — §III). Diferente do Consolidado
 * ABC (gerado server-side a partir de placeholder), aqui o CSV JÁ VEM PRONTO do core-api (text/csv); o BFF só
 * busca os bytes e nomeia o arquivo (`plano-{id}.csv`). Erros como valores (§II). O PORT vive aqui (application).
 */
import { ok, isErr, type Result } from '#shared/primitives/result.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'
import type { BudgetPlanCsv } from '#modules/budget-plans/server/domain/plan-actions.io.ts'

export type ExportBudgetPlanCsvClient = Readonly<{
  generateCsv: (id: string, token: string) => Promise<Result<string, BudgetPlansError>>
}>

export type ExportBudgetPlanCsvDeps = Readonly<{ client: ExportBudgetPlanCsvClient }>

export const createExportBudgetPlanCsv =
  (deps: ExportBudgetPlanCsvDeps) =>
  async (id: string, token: string): Promise<Result<BudgetPlanCsv, BudgetPlansError>> => {
    const r = await deps.client.generateCsv(id, token)
    if (isErr(r)) return r
    return ok({ filename: `plano-${id}.csv`, content: r.value })
  }
