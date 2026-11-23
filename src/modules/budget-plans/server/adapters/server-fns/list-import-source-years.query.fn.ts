/**
 * Server function: anos de ORIGEM do "Criar a partir do ano de" (spec 134). Fronteira RPC única (§III); auth NO
 * HANDLER; Zod na borda (§IX); erro como valor (§V).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { ListImportSourceYearsInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type ListImportSourceYearsFnResult =
  | Readonly<{ ok: true; data: readonly number[] }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const listImportSourceYearsFn = createServerFn({ method: 'GET' })
  .inputValidator(ListImportSourceYearsInputSchema)
  .handler(async ({ data }): Promise<ListImportSourceYearsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().listImportSourceYears(data.programRef, accessToken)
    return isErr(r) ? { ok: false, error: r.error } : { ok: true, data: r.value }
  })
