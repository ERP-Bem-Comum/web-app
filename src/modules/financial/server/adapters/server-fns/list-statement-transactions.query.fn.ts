/**
 * Server function: listar transações de um extrato (GET /api/v2/financial/bank-statements/:id/
 * transactions). Fronteira RPC (§III). Sem filtro server-side (filtra no client). RBAC
 * `reconciliation:read` (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { ListTransactionsInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { StatementTransaction } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ListTransactionsFnResult =
  | Readonly<{ ok: true; data: readonly StatementTransaction[] }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const listStatementTransactionsFn = createServerFn({ method: 'GET' })
  .inputValidator(ListTransactionsInputSchema)
  .handler(async ({ data }): Promise<ListTransactionsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().listTransactions(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
