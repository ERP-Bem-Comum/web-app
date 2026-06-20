/**
 * Server function: listar contas-cedente da organização (GET /api/v2/financial/cedente-accounts, #138).
 * Fronteira RPC (§III). Sem input. RBAC `bank-account:read` no core-api (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import type { CedenteAccount } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ListCedenteAccountsFnResult =
  | Readonly<{ ok: true; data: readonly CedenteAccount[] }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const listCedenteAccountsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ListCedenteAccountsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().listCedenteAccounts(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
