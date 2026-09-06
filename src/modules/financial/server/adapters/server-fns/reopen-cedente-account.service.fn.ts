/**
 * Server function: reabrir conta-cedente (POST /api/v2/financial/cedente-accounts/:id/reopen).
 * Fronteira RPC (§III). RBAC `bank-account:write` no core-api (403 → 'forbidden').
 *
 * `Closed` → `Active`, preservando id, histórico, conciliações, convênio e o contador de NSA
 * (core-api#995 B1). É o desfazer que faltava: até 06/09/2026 encerrar era terminal, e uma conta
 * encerrada por engano ficava presa — não reabria e não podia ser recadastrada, porque a linha
 * encerrada seguia ocupando a chave natural.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import { ReopenCedenteAccountInputSchema } from '#modules/financial/server/adapters/reconciliation.io-schemas.ts'
import type { CedenteAccount } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ReopenCedenteAccountFnResult =
  | Readonly<{ ok: true; data: CedenteAccount }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const reopenCedenteAccountFn = createServerFn({ method: 'POST' })
  .inputValidator(ReopenCedenteAccountInputSchema)
  .handler(async ({ data }): Promise<ReopenCedenteAccountFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().reopenCedenteAccount(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
