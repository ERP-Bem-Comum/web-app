/**
 * Server function: exportar o Consolidado ABC em CSV (fronteira RPC única — §III). O CSV vem do core-api
 * (`GET /budget-plans/consolidated-result/csv`); o BFF só o repassa como `{ filename, content }` e o client
 * dispara o download. Auth NO HANDLER (§ server-fn): sessão + token resolvidos aqui. Zod na borda (§IX).
 * Erro como valor (§V).
 */
import { createServerFn } from '@tanstack/react-start'

import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { ConsolidadoAbcQuerySchema } from '#modules/budget-plans/server/adapters/consolidado-abc.io-schemas.ts'
import type { ConsolidatedAbcCsv } from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type ExportConsolidadoAbcCsvFnResult =
  | Readonly<{ ok: true; data: ConsolidatedAbcCsv }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const exportConsolidadoAbcCsvFn = createServerFn({ method: 'GET' })
  .inputValidator(ConsolidadoAbcQuerySchema)
  .handler(async ({ data }): Promise<ExportConsolidadoAbcCsvFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().exportConsolidadoCsv(
      { year: data.year, programRef: data.programRef },
      accessToken,
    )
    return r.ok ? { ok: true, data: r.value } : { ok: false, error: r.error }
  })
