/**
 * Server function: EDIÇÃO DE ORÇAMENTO — a matriz Categorias × 12 meses de UMA rede (HANDBOOK §1.7). Fronteira
 * RPC única (§III): o BFF costura cabeçalho + estrutura + resultados do mês e entrega a grade PRONTA.
 *
 * Auth NO HANDLER (§ server-fn): `createServerFn` é chamável por POST direto — sessão e token se resolvem aqui,
 * nunca só no `beforeLoad`. Zod na borda (§IX). Erro como valor (§V): a UI trata a tag, não o status HTTP.
 */
import { createServerFn } from '@tanstack/react-start'

import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { GetBudgetGridInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { BudgetGridComposed } from '#modules/budget-plans/server/application/get-budget-grid.use-case.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type GetBudgetGridFnResult =
  | Readonly<{ ok: true; data: BudgetGridComposed }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const getBudgetGridFn = createServerFn({ method: 'GET' })
  .inputValidator(GetBudgetGridInputSchema)
  .handler(async ({ data }): Promise<GetBudgetGridFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().getBudgetGrid(data.planId, data.networkRef, accessToken)
    return r.ok ? { ok: true, data: r.value } : { ok: false, error: r.error }
  })
