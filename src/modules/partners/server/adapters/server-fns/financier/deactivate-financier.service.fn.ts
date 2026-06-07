/**
 * Server function: desativar Financiador (idempotente, SEM motivo). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { financierServer } from '../../financier.composition.ts'
import { DeactivateFinancierInputSchema, type FinancierDetail } from '#modules/partners/server/domain/financier/financier.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type DeactivateFinancierFnResult =
  | Readonly<{ ok: true; data: FinancierDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const deactivateFinancierFn = createServerFn({ method: 'POST' })
  .inputValidator(DeactivateFinancierInputSchema)
  .handler(async ({ data }): Promise<DeactivateFinancierFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await financierServer().deactivateFinancier(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
