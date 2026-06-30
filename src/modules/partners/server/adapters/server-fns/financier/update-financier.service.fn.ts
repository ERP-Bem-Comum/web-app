/**
 * Server function: editar Financiador (PUT total dos campos). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financierServer } from '../../financier.composition.ts'
import { UpdateFinancierInputSchema } from "#modules/partners/server/adapters/financier.io-schemas.ts"
import type { FinancierDetail } from "#modules/partners/server/domain/financier/financier.io.ts"
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type UpdateFinancierFnResult =
  | Readonly<{ ok: true; data: FinancierDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const updateFinancierFn = createServerFn({ method: 'POST' })
  .inputValidator(UpdateFinancierInputSchema)
  .handler(async ({ data }): Promise<UpdateFinancierFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financierServer().updateFinancier(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
