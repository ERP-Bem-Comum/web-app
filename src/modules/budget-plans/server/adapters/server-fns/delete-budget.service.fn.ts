/**
 * Server function: remover ORÇAMENTO por rede (`DELETE /budget-plans/:id/budgets/:budgetId` — #394, Grupo C).
 * Fronteira RPC (§III). Auth no handler; Zod na borda. Erro como valor.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { DeleteBudgetInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type DeleteBudgetFnResult = Readonly<{ ok: true }> | Readonly<{ ok: false; error: BudgetPlansError }>

export const deleteBudgetFn = createServerFn({ method: 'POST' })
  .inputValidator(DeleteBudgetInputSchema)
  .handler(async ({ data }): Promise<DeleteBudgetFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().deleteBudget(
      { planId: data.planId, budgetId: data.budgetId },
      accessToken,
    )
    return isErr(r) ? { ok: false, error: r.error } : { ok: true }
  })
