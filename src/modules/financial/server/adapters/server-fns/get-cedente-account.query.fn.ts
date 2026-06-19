/**
 * Server function: obter uma conta-cedente por id (GET /api/v2/financial/cedente-accounts/:id, #138).
 * Fronteira RPC (§III). RBAC `bank-account:read` no core-api (403 → 'forbidden'). Usada pelo hero do
 * workspace (identidade da conta da rota).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { GetCedenteAccountInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { CedenteAccount } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type GetCedenteAccountFnResult =
  | Readonly<{ ok: true; data: CedenteAccount }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const getCedenteAccountFn = createServerFn({ method: 'GET' })
  .inputValidator(GetCedenteAccountInputSchema)
  .handler(async ({ data }): Promise<GetCedenteAccountFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().getCedenteAccount(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
