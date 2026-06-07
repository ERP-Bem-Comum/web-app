/**
 * Server function: editar Fornecedor (PUT total dos campos). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { supplierServer } from '../../supplier.composition.ts'
import { UpdateSupplierInputSchema, type SupplierDetail } from '#modules/partners/server/domain/supplier/supplier.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type UpdateSupplierFnResult =
  | Readonly<{ ok: true; data: SupplierDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const updateSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator(UpdateSupplierInputSchema)
  .handler(async ({ data }): Promise<UpdateSupplierFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await supplierServer().updateSupplier(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
