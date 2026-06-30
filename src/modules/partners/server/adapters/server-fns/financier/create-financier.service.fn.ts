/**
 * Server function: criar Financiador (PJ, 6 campos). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financierServer } from '../../financier.composition.ts'
import { CreateFinancierInputSchema } from "#modules/partners/server/adapters/financier.io-schemas.ts"
import type { FinancierDetail } from "#modules/partners/server/domain/financier/financier.io.ts"
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type CreateFinancierFnResult =
  | Readonly<{ ok: true; data: FinancierDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const createFinancierFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateFinancierInputSchema)
  .handler(async ({ data }): Promise<CreateFinancierFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financierServer().createFinancier(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
