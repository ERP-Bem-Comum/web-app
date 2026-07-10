/**
 * Server function: adicionar ORÇAMENTO por rede (`POST /budget-plans/:id/budgets` — #394, Grupo C). Fronteira
 * RPC (§III). Auth no handler; Zod na borda (§IX). `partnerRef` = chave natural (UF/IBGE). Erro como valor.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { AddBudgetInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type AddBudgetFnResult = Readonly<{ ok: true }> | Readonly<{ ok: false; error: BudgetPlansError }>

export const addBudgetFn = createServerFn({ method: 'POST' })
  .inputValidator(AddBudgetInputSchema)
  .handler(async ({ data }): Promise<AddBudgetFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().addBudget(
      {
        planId: data.planId,
        partnerKind: data.partnerKind,
        partnerRef: data.partnerRef,
        valueInCents: data.valueInCents,
      },
      accessToken,
    )
    return isErr(r) ? { ok: false, error: r.error } : { ok: true }
  })
