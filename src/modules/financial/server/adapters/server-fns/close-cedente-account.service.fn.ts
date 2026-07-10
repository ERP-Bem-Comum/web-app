/**
 * Server function: encerrar conta-cedente (POST /api/v2/financial/cedente-accounts/:id/close). Fronteira RPC
 * (§III). RBAC `bank-account:write` no core-api (403 → 'forbidden'). Open → Closed; irreversível na UI.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { CloseCedenteAccountInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { CedenteAccount } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type CloseCedenteAccountFnResult =
  | Readonly<{ ok: true; data: CedenteAccount }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const closeCedenteAccountFn = createServerFn({ method: 'POST' })
  .inputValidator(CloseCedenteAccountInputSchema)
  .handler(async ({ data }): Promise<CloseCedenteAccountFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().closeCedenteAccount(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
