/**
 * Server function: rejeitar uma sugestão (POST /api/v2/financial/statement-transactions/:id/
 * reject-suggestion). Fronteira RPC (§III). A sugestão rejeitada não reaparece. RBAC
 * `reconciliation:write` (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { RejectSuggestionInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { RejectedSuggestion } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type RejectSuggestionFnResult =
  | Readonly<{ ok: true; data: RejectedSuggestion }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const rejectSuggestionFn = createServerFn({ method: 'POST' })
  .inputValidator(RejectSuggestionInputSchema)
  .handler(async ({ data }): Promise<RejectSuggestionFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().rejectSuggestion(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
