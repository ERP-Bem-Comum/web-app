/**
 * Server function: importar extrato bancário (POST /api/v2/financial/bank-statements). Fronteira RPC
 * (§III). Autentica via sessão, valida o input, chama o use-case. RBAC `reconciliation:import` é cobrado
 * pelo core-api (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { ImportStatementInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { BankStatementImport } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ImportStatementFnResult =
  | Readonly<{ ok: true; data: BankStatementImport }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const importBankStatementFn = createServerFn({ method: 'POST' })
  .inputValidator(ImportStatementInputSchema)
  .handler(async ({ data }): Promise<ImportStatementFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().importStatement(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
