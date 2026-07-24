/**
 * Server function: excluir um extrato bancário importado (DELETE /api/v2/financial/bank-statements/:id —
 * core-api#558). Fronteira RPC (§III). Hard-delete: as transações somem por FK cascade. 204 sem corpo.
 * Guardas (409): `statement-has-reconciled-transactions` (desfaça antes) e `period-closed` (reabra antes).
 * RBAC no core-api; auth checada AQUI (o RPC é chamável por POST direto). Retorna Result como valor (§V).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { DeleteStatementInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type DeleteBankStatementFnResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const deleteBankStatementFn = createServerFn({ method: 'POST' })
  .inputValidator(DeleteStatementInputSchema)
  .handler(async ({ data }): Promise<DeleteBankStatementFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().deleteBankStatement(data.statementId, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true }
  })
