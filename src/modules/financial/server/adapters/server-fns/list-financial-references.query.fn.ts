/**
 * Server function: dados de referência da categorização (020 · #200/#147) — categorias + centros de custo.
 * Fronteira RPC (§III). Sem input. RBAC `reference:read` no core-api (403 → 'forbidden'). Uma chamada traz
 * as duas listas (o cliente HTTP faz o fan-out) p/ a UI popular os selects de Categoria/Centro de custo.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { reconciliationServer } from '../reconciliation.composition.ts'
import type { FinancialReferences } from '#modules/financial/server/domain/reconciliation.io.ts'
import type { ReconciliationError } from '#modules/financial/server/domain/errors/reconciliation.errors.ts'

export type ListFinancialReferencesFnResult =
  | Readonly<{ ok: true; data: FinancialReferences }>
  | Readonly<{ ok: false; error: ReconciliationError }>

export const listFinancialReferencesFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ListFinancialReferencesFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await reconciliationServer().listReferences(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
