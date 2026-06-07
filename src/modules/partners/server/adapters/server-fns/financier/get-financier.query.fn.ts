/**
 * Server function: detalhe de um Financiador por id. Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financierServer } from '../../financier.composition.ts'
import { GetFinancierInputSchema, type FinancierDetail } from '#modules/partners/server/domain/financier/financier.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type GetFinancierFnResult =
  | Readonly<{ ok: true; data: FinancierDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const getFinancierFn = createServerFn({ method: 'GET' })
  .inputValidator(GetFinancierInputSchema)
  .handler(async ({ data }): Promise<GetFinancierFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financierServer().getFinancier(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
