/**
 * Server function: detalhe de um Fornecedor por id. Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { supplierServer } from '../../supplier.composition.ts'
import { GetSupplierInputSchema } from "#modules/partners/server/adapters/supplier.io-schemas.ts"
import type { SupplierDetail } from "#modules/partners/server/domain/supplier/supplier.io.ts"
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type GetSupplierFnResult =
  | Readonly<{ ok: true; data: SupplierDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const getSupplierFn = createServerFn({ method: 'GET' })
  .inputValidator(GetSupplierInputSchema)
  .handler(async ({ data }): Promise<GetSupplierFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await supplierServer().getSupplier(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
