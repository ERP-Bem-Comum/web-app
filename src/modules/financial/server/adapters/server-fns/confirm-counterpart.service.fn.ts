/**
 * Server function: confirmar contrapartida (US2 do #269 — POST /api/v2/financial/reconciliations/counterpart).
 * Fronteira RPC (§III). Concilia a transação contra a contrapartida esperada escolhida (transferência entre
 * contas). O core-api revalida (valor/conta/estado da contrapartida). RBAC `reconciliation:write` (403 →
 * 'forbidden'). Espelha `create-reconciliation.service.fn.ts`.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { ConfirmCounterpartInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { ConfirmCounterpartResult } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ConfirmCounterpartFnResult =
  | Readonly<{ ok: true; data: ConfirmCounterpartResult }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const confirmCounterpartFn = createServerFn({ method: 'POST' })
  .inputValidator(ConfirmCounterpartInputSchema)
  .handler(async ({ data }): Promise<ConfirmCounterpartFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().confirmCounterpart(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
