/**
 * Server function: LISTA de Planejamento (fronteira RPC única — §III). Auth NO HANDLER (§ server-fn):
 * `createServerFn` é chamável por POST direto, então sessão + token são resolvidos aqui, não só no
 * `beforeLoad`. Zod na borda (§IX). Erro como valor (§V): devolve `{ ok, data | error }` — a UI trata a tag.
 */
import { createServerFn } from '@tanstack/react-start'

import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { ListBudgetPlansInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { PlanejamentoListPage } from '#modules/budget-plans/server/domain/planejamento-list.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type ListBudgetPlansFnResult =
  | Readonly<{ ok: true; data: PlanejamentoListPage }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const listBudgetPlansFn = createServerFn({ method: 'GET' })
  .inputValidator(ListBudgetPlansInputSchema)
  .handler(async ({ data }): Promise<ListBudgetPlansFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().listBudgetPlans(
      { page: data.page, limit: data.limit, year: data.year, status: data.status },
      accessToken,
    )
    return r.ok ? { ok: true, data: r.value } : { ok: false, error: r.error }
  })
