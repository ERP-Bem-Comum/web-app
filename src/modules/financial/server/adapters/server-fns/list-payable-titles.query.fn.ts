/**
 * Server function: listagem payable-centric — Contas a Pagar por TÍTULO (#201/#222).
 * GET /api/v2/financial/payable-titles (pai + filhos como linhas, status próprio por título). Fronteira
 * RPC (§III). RBAC `financial:read` no core-api (403 → 'forbidden'). Distinta do GET /payables?status=Paid
 * (busca de conciliação, outro concern/RBAC).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financialServer } from '../financial.composition.ts'
import { ListPayableTitlesInputSchema } from '#modules/financial/server/adapters/financial.io-schemas.ts'
import type { PayableTitleListResponse } from '#modules/financial/server/domain/document.io.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'

export type ListPayableTitlesFnResult =
  | Readonly<{ ok: true; data: PayableTitleListResponse }>
  | Readonly<{ ok: false; error: FinancialError }>

export const listPayableTitlesFn = createServerFn({ method: 'GET' })
  .inputValidator(ListPayableTitlesInputSchema)
  .handler(async ({ data }): Promise<ListPayableTitlesFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financialServer().listPayableTitles(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
