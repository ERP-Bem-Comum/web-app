/**
 * Server function: exportar o Consolidado ABC em CSV (fronteira RPC única — §III). O CSV é gerado
 * SERVER-SIDE (Decisão 11 da P.O.): o BFF serializa e devolve `{ filename, content }` pronto; o client só
 * dispara o download. Auth NO HANDLER (§ server-fn): `createServerFn` é chamável por POST direto, então a
 * sessão é checada aqui, não só no `beforeLoad`. Zod na borda (§IX). Erro como valor (§V).
 */
import { createServerFn } from '@tanstack/react-start'

import { getCurrentUserFn } from '#modules/auth/public-api/index.ts'
import { consolidadoAbcServer } from '#modules/budget-plans/server/adapters/consolidado-abc.composition.ts'
import { ExportConsolidadoAbcInputSchema } from '#modules/budget-plans/server/adapters/consolidado-abc.io-schemas.ts'
import type { ConsolidatedAbcCsv } from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type ExportConsolidadoAbcCsvFnResult =
  | Readonly<{ ok: true; data: ConsolidatedAbcCsv }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const exportConsolidadoAbcCsvFn = createServerFn({ method: 'GET' })
  .inputValidator(ExportConsolidadoAbcInputSchema)
  .handler(async ({ data }): Promise<ExportConsolidadoAbcCsvFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const r = consolidadoAbcServer().exportConsolidadoAbcCsv({ year: data.year, programs: data.programs })
    return r.ok ? { ok: true, data: r.value } : { ok: false, error: r.error }
  })
