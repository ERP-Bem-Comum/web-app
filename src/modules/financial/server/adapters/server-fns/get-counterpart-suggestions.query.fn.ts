/**
 * Server function: contrapartidas esperadas que casam com uma transação (US2 do #269 — GET
 * /api/v2/financial/statement-transactions/:id/counterpart-suggestions). Fronteira RPC (§III). Transferência
 * entre contas: lista as contrapartidas Pending candidatas p/ a transação real de crédito. RBAC
 * `reconciliation:read` (403 → 'forbidden'). Espelha `get-statement-suggestions.query.fn.ts`.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { GetCounterpartSuggestionsInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { CounterpartSuggestion } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type GetCounterpartSuggestionsFnResult =
  | Readonly<{ ok: true; data: readonly CounterpartSuggestion[] }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const getCounterpartSuggestionsFn = createServerFn({ method: 'GET' })
  .inputValidator(GetCounterpartSuggestionsInputSchema)
  .handler(async ({ data }): Promise<GetCounterpartSuggestionsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().getCounterpartSuggestions(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
