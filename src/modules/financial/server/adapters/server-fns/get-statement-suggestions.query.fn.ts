/**
 * Server function: palpites de topo em lote por extrato (#174 — GET /api/v2/financial/bank-statements/
 * :id/suggestions). Fronteira RPC (§III). Uma chamada devolve a banda/score de topo de TODAS as
 * transações, p/ o grid pintar a coluna sem N requisições. RBAC `reconciliation:read` (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { GetStatementSuggestionsInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { StatementSuggestion } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type GetStatementSuggestionsFnResult =
  | Readonly<{ ok: true; data: readonly StatementSuggestion[] }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const getStatementSuggestionsFn = createServerFn({ method: 'GET' })
  .inputValidator(GetStatementSuggestionsInputSchema)
  .handler(async ({ data }): Promise<GetStatementSuggestionsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().getStatementSuggestions(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
