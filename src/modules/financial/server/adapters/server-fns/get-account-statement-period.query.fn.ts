/**
 * Server function: extrato por PERÍODO de uma conta-cedente (#205 — GET /cedente-accounts/:id/statement
 * ?from&to&filter). Fronteira RPC (§III). RBAC `reconciliation:read` no core-api. Devolve o saldo do
 * período (abertura acumulada até `from` + fechamento) e a soma das entradas/saídas — base da faixa de
 * saldo do período na aba Extrato.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { GetAccountStatementInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { AccountStatementPeriod } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type GetAccountStatementPeriodFnResult =
  | Readonly<{ ok: true; data: AccountStatementPeriod }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const getAccountStatementPeriodFn = createServerFn({ method: 'GET' })
  .inputValidator(GetAccountStatementInputSchema)
  .handler(async ({ data }): Promise<GetAccountStatementPeriodFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().getAccountStatementPeriod(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
