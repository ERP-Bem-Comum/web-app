/**
 * Server function: CRIAR Centro de Custo no plano (`POST /:id/cost-structure/cost-centers` — fronteira RPC
 * única §III, feature 061). Auth NO HANDLER (§ server-fn): sessão + token resolvidos aqui. Zod na borda (§IX).
 * Erro como valor (§V): devolve `{ ok, data | error }` — a UI trata a tag. `data` = árvore-eco (201 do core).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { AddCostCenterInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { CostStructureTree } from '#modules/budget-plans/server/domain/cost-structure-write.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type AddCostCenterFnResult =
  | Readonly<{ ok: true; data: CostStructureTree }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const addCostCenterFn = createServerFn({ method: 'POST' })
  .inputValidator(AddCostCenterInputSchema)
  .handler(async ({ data }): Promise<AddCostCenterFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().addCostCenter(
      { planId: data.planId, name: data.name, direction: data.direction },
      accessToken,
    )
    return isErr(r) ? { ok: false, error: r.error } : { ok: true, data: r.value }
  })
