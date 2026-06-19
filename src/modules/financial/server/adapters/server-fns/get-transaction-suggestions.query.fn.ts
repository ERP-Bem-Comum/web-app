/**
 * Server function: sugestões de match de uma transação (GET /api/v2/financial/statement-transactions/
 * :id/suggestions). Fronteira RPC (§III). Banda 'baixa' é filtrada pelo backend. RBAC
 * `reconciliation:read` (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { GetSuggestionsInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { MatchSuggestion } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type GetSuggestionsFnResult =
  | Readonly<{ ok: true; data: readonly MatchSuggestion[] }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const getTransactionSuggestionsFn = createServerFn({ method: 'GET' })
  .inputValidator(GetSuggestionsInputSchema)
  .handler(async ({ data }): Promise<GetSuggestionsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().getSuggestions(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
