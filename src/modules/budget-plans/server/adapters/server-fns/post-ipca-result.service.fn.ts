/**
 * Server function: cálculo IPCA (Tipo B) de uma subcategoria numa rede (`POST /budget-plans/budget-results/ipca`
 * — #C2). Fronteira RPC (§III). Auth no handler; Zod na borda. O backend calcula `base * (1 + ipca/100)`.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { IpcaBudgetResultInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type PostIpcaResultFnResult = Readonly<{ ok: true }> | Readonly<{ ok: false; error: BudgetPlansError }>

export const postIpcaResultFn = createServerFn({ method: 'POST' })
  .inputValidator(IpcaBudgetResultInputSchema)
  .handler(async ({ data }): Promise<PostIpcaResultFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().postIpcaResult(
      {
        budgetId: data.budgetId,
        subcategoryId: data.subcategoryId,
        baseValueInCents: data.baseValueInCents,
        ipca: data.ipca,
      },
      accessToken,
    )
    return isErr(r) ? { ok: false, error: r.error } : { ok: true }
  })
