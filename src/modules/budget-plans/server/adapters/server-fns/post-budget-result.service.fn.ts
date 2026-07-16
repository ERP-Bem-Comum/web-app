/**
 * Server function: "Calculando Gastos" — grava UM mês de UMA subcategoria numa rede (§1.7). Roteia pelos 4
 * POSTs de cálculo do core-api (`/budget-results/{ipca|caed|personal-expenses|logistics-expenses}`) conforme
 * o `kind`. Fronteira RPC única (§III); auth no handler; Zod na borda (§IX).
 *
 * O CÁLCULO é do core-api: mandamos os INSUMOS, ele devolve o valor. O front também calcula — mas só para
 * MOSTRAR o total enquanto o usuário digita; a verdade gravada é a do backend (uma fórmula, um dono).
 *
 * Recalcular o mesmo (rede, subcategoria, mês) SUBSTITUI o valor — upsert no core-api pela chave dos três.
 * Um POST por mês; o fan-out dos meses selecionados é do client (não há endpoint de lote).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { PostBudgetResultInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type PostBudgetResultFnResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const postBudgetResultFn = createServerFn({ method: 'POST' })
  .inputValidator(PostBudgetResultInputSchema)
  .handler(async ({ data }): Promise<PostBudgetResultFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    // `planId` é só do client (invalidação da grade) — não faz parte do comando do core-api.
    const { planId: _planId, ...command } = data
    const r = await budgetPlansServer().postBudgetResult(command, accessToken)
    return isErr(r) ? { ok: false, error: r.error } : { ok: true }
  })
