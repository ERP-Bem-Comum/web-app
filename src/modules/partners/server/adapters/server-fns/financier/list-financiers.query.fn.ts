/**
 * Server function: listar Financiadores. Fronteira RPC (Princ. I).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financierServer } from '../../financier.composition.ts'
import { ListFinanciersInputSchema, type FinancierListResponse } from '#modules/partners/server/domain/financier/financier.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type ListFinanciersFnResult =
  | Readonly<{ ok: true; data: FinancierListResponse }>
  | Readonly<{ ok: false; error: PartnersError }>

export const listFinanciersFn = createServerFn({ method: 'GET' })
  .inputValidator(ListFinanciersInputSchema)
  .handler(async ({ data }): Promise<ListFinanciersFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financierServer().listFinanciers(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
