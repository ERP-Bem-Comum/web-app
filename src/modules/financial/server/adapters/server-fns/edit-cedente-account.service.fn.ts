/**
 * Server function: editar conta-cedente (PATCH /api/v2/financial/cedente-accounts/:id). Fronteira RPC (§III).
 * RBAC `bank-account:write` no core-api (403 → 'forbidden'). PATCH parcial dos campos editáveis (banco,
 * agência, conta-DV, tipo, apelido); CNPJ e saldo de abertura são imutáveis. Devolve a conta atualizada.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { EditCedenteAccountInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { CedenteAccount } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type EditCedenteAccountFnResult =
  | Readonly<{ ok: true; data: CedenteAccount }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const editCedenteAccountFn = createServerFn({ method: 'POST' })
  .inputValidator(EditCedenteAccountInputSchema)
  .handler(async ({ data }): Promise<EditCedenteAccountFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().editCedenteAccount(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
