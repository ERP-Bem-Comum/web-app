/**
 * Server function: obter a conciliação ATIVA de uma transação (GET /api/v2/financial/statement-
 * transactions/:id/reconciliation, #175). Fronteira RPC (§III). RBAC `reconciliation:read` no core-api.
 * `data: null` = transação sem conciliação ativa (404 no core-api é tratado como vazio, não erro).
 * Habilita Desfazer pós-reload + lado Auditoria do modal de detalhes.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { GetTransactionReconciliationInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { TransactionReconciliation } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type GetTransactionReconciliationFnResult =
  | Readonly<{ ok: true; data: TransactionReconciliation | null }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const getTransactionReconciliationFn = createServerFn({ method: 'GET' })
  .inputValidator(GetTransactionReconciliationInputSchema)
  .handler(async ({ data }): Promise<GetTransactionReconciliationFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().getTransactionReconciliation(
      { transactionId: data.transactionId },
      accessToken,
    )
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
