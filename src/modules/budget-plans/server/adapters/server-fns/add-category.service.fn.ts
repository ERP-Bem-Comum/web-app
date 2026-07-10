/**
 * Server function: CRIAR Categoria sob um centro (`POST /:id/cost-structure/categories` — fronteira RPC única
 * §III, feature 061). Auth NO HANDLER; Zod na borda (§IX). O `costCenterId` é o UUID (`ref`) do centro-pai.
 * Erro como valor (§V): `{ ok, data | error }`. `data` = árvore-eco (201 do core).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { AddCategoryInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { CostStructureTree } from '#modules/budget-plans/server/domain/cost-structure-write.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type AddCategoryFnResult =
  | Readonly<{ ok: true; data: CostStructureTree }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const addCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(AddCategoryInputSchema)
  .handler(async ({ data }): Promise<AddCategoryFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().addCategory(
      { planId: data.planId, costCenterId: data.costCenterId, name: data.name },
      accessToken,
    )
    return isErr(r) ? { ok: false, error: r.error } : { ok: true, data: r.value }
  })
