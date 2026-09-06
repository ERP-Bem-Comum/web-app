/**
 * Server function: excluir conta-cedente (DELETE /api/v2/financial/cedente-accounts/:id).
 * Fronteira RPC (§III). RBAC `bank-account:write` no core-api (403 → 'forbidden').
 *
 * `Closed` → `Deleted` (core-api#995 B3). ⚠️ SOFT DELETE, e a distinção não é detalhe de implementação:
 * a linha sai da listagem e **libera a chave natural** (banco/agência/conta/dígito), mas o registro
 * continua no banco — remessas, conciliações e extrato apontam para o id, e apagar de verdade quebraria
 * essas referências.
 *
 * É `POST` no transporte do TanStack Start, como toda server fn de escrita; quem fala DELETE é o
 * cliente do core-api, uma camada adiante.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { DeleteCedenteAccountInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { CedenteAccount } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type DeleteCedenteAccountFnResult =
  | Readonly<{ ok: true; data: CedenteAccount }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const deleteCedenteAccountFn = createServerFn({ method: 'POST' })
  .inputValidator(DeleteCedenteAccountInputSchema)
  .handler(async ({ data }): Promise<DeleteCedenteAccountFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().deleteCedenteAccount(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
