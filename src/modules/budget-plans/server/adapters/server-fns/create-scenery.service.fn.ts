/**
 * Server function: CRIAR CENÁRIO (`POST /api/v2/budget-plans/:id/scenery` — fronteira RPC única §III). Body
 * `{ name }` (1..255). Auth NO HANDLER (§ server-fn). Zod na borda (§IX). Erro como valor (§V): a UI trata a
 * tag (409 → `budget-plan-scenery-needs-draft` — cenário só em plano NÃO aprovado, 404 → not-found).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { budgetPlansServer } from '#modules/budget-plans/server/adapters/budget-plans-list.composition.ts'
import { CreateSceneryInputSchema } from '#modules/budget-plans/server/adapters/budget-plans-list.io-schemas.ts'
import type { CreatedScenery } from '#modules/budget-plans/server/domain/plan-actions.io.ts'
import type { BudgetPlansError } from '#modules/budget-plans/server/domain/errors/budget-plans.errors.ts'

export type CreateSceneryFnResult =
  | Readonly<{ ok: true; data: CreatedScenery }>
  | Readonly<{ ok: false; error: BudgetPlansError }>

export const createSceneryFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateSceneryInputSchema)
  .handler(async ({ data }): Promise<CreateSceneryFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }

    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await budgetPlansServer().createScenery({ id: data.id, name: data.name }, accessToken)
    return isErr(r) ? { ok: false, error: r.error } : { ok: true, data: r.value }
  })
