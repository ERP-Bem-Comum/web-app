/**
 * Server function: EXCLUIR Plano Orçamentário (`DELETE /api/v2/budget-plans/:id` — fronteira RPC única §III,
 * feature 076 / core-api #453). Auth NO HANDLER (§ server-fn); Zod na borda (§IX). Erro como valor (§V).
 *
 * 204 sem body → `{ ok: true }` sem `data`. AÇÃO IRREVERSÍVEL: o core apaga o plano + orçamentos + lançamentos
 * na mesma transação. Não confundir com `deleteBudgetFn`, que remove um ORÇAMENTO por rede.
 *
 * 409 = plano APROVADO ou plano COM CENÁRIO — indistinguíveis, uma tag só (`budget-plan-not-deletable`). No
 * caminho normal não chega: o menu desabilita nos 2 casos (`isActionEnabled`). Sobra a corrida.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { PlanIdInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type DeleteBudgetPlanFnResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const deleteBudgetPlanFn = createServerFn({ method: 'POST' })
  .inputValidator(PlanIdInputSchema)
  .handler(async ({ data }): Promise<DeleteBudgetPlanFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().deletePlan(data.id, accessToken)
    return isErr(r) ? { ok: false, error: r.error } : { ok: true }
  })
