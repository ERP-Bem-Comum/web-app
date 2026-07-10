/**
 * Server function: LEITURA do Consolidado ABC (fronteira RPC única — §III). O BFF chama o core-api
 * `GET /budget-plans/consolidated-result?year=&programRef=` e entrega o `ConsolidatedAbc` PRONTO. Auth NO
 * HANDLER (§ server-fn): `createServerFn` é chamável por POST direto, então sessão + token são resolvidos
 * aqui, não só no `beforeLoad`. Zod na borda (§IX). Erro como valor (§V): a UI trata a tag.
 */
import { createServerFn } from '@tanstack/react-start'

import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { ConsolidadoAbcQuerySchema } from '#modules/budget-plans/server/adapters/consolidado-abc.io-schemas.ts'
import type { ConsolidatedAbc } from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type GetConsolidadoAbcFnResult =
  | Readonly<{ ok: true; data: ConsolidatedAbc }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const getConsolidadoAbcFn = createServerFn({ method: 'GET' })
  .inputValidator(ConsolidadoAbcQuerySchema)
  .handler(async ({ data }): Promise<GetConsolidadoAbcFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().getConsolidado(
      { year: data.year, programRef: data.programRef },
      accessToken,
    )
    return r.ok ? { ok: true, data: r.value } : { ok: false, error: r.error }
  })
