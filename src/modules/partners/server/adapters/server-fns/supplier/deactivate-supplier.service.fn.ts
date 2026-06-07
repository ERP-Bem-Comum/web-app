/**
 * Server function: desativar Fornecedor (idempotente, SEM motivo). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { supplierServer } from '../../supplier.composition.ts'
import { DeactivateSupplierInputSchema, type SupplierDetail } from '#modules/partners/server/domain/supplier/supplier.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type DeactivateSupplierFnResult =
  | Readonly<{ ok: true; data: SupplierDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const deactivateSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator(DeactivateSupplierInputSchema)
  .handler(async ({ data }): Promise<DeactivateSupplierFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await supplierServer().deactivateSupplier(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
