/**
 * Server function: RENOMEAR e/ou (DES)ATIVAR um nó da estrutura de custo (feature 075 — #454 gap 3).
 * `PATCH /:id/cost-structure/{cost-centers|categories|subcategories}/:nodeId` — fronteira RPC única (§III).
 * Auth NO HANDLER; Zod na borda (§IX). O `nodeId` é o UUID (`ref`) do nó; o `level` roteia o PATH no client.
 * Erro como valor (§V): `{ ok, data | error }`. `data` = árvore-eco (200 do core, a árvore INTEIRA).
 *
 * Um caso de uso p/ os 3 níveis × 2 campos: o fluxo é idêntico e só muda o segmento do PATH — espelha o
 * desenho do core (`patch-cost-node.ts`), que também não quebrou em 3 use-cases.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { PatchCostNodeInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { CostStructureTree } from '#modules/budget-plans/server/domain/cost-structure-write.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type PatchCostNodeFnResult =
  | Readonly<{ ok: true; data: CostStructureTree }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const patchCostNodeFn = createServerFn({ method: 'POST' })
  .inputValidator(PatchCostNodeInputSchema)
  .handler(async ({ data }): Promise<PatchCostNodeFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().patchCostNode(
      {
        planId: data.planId,
        level: data.level,
        nodeId: data.nodeId,
        // Preserva a AUSÊNCIA (não manda `undefined`): `{ name: undefined }` viraria `{}` no JSON e o core
        // recusaria com 400. Renomear e (des)ativar são independentes — cada um manda só o seu campo.
        ...(data.name === undefined ? {} : { name: data.name }),
        ...(data.active === undefined ? {} : { active: data.active }),
      },
      accessToken,
    )
    return isErr(r) ? { ok: false, error: r.error } : { ok: true, data: r.value }
  })
