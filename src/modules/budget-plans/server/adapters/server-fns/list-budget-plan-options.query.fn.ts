/**
 * Server function: opções do CATÁLOGO de programas do Plano Orçamentário (`GET /api/v2/budget-plans/options`
 * — fronteira RPC única §III). Fonte do `programRef` real para o dropdown do "Adicionar Plano". Auth NO
 * HANDLER (§ server-fn). Erro como valor (§V): `{ ok, data | error }`. Sem input (não recebe params).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type BudgetPlanOptionView = Readonly<{ ref: string; abbreviation: string }>
export type BudgetPlanOptionsPage = Readonly<{ programs: readonly BudgetPlanOptionView[] }>

export type ListBudgetPlanOptionsFnResult =
  | Readonly<{ ok: true; data: BudgetPlanOptionsPage }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const listBudgetPlanOptionsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ListBudgetPlanOptionsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().listProgramOptions(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return {
      ok: true,
      data: { programs: r.value.map((p) => ({ ref: p.ref, abbreviation: p.abbreviation })) },
    }
  },
)
