/**
 * Server function: CRIAR Subcategoria sob uma categoria (`POST /:id/cost-structure/subcategories` — fronteira
 * RPC única §III, feature 061). Auth NO HANDLER; Zod na borda (§IX). O `categoryId` é o UUID (`ref`) da
 * categoria-pai; `launchType` é o literal EXATO do backend. Erro como valor (§V): `{ ok, data | error }`.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { AddSubcategoryInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { CostStructureTree } from '#modules/budget-plans/server/domain/cost-structure-write.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type AddSubcategoryFnResult =
  | Readonly<{ ok: true; data: CostStructureTree }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const addSubcategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(AddSubcategoryInputSchema)
  .handler(async ({ data }): Promise<AddSubcategoryFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().addSubcategory(
      { planId: data.planId, categoryId: data.categoryId, name: data.name, launchType: data.launchType },
      accessToken,
    )
    return isErr(r) ? { ok: false, error: r.error } : { ok: true, data: r.value }
  })
