/**
 * Server function: criar Fornecedor (PJ, 3 seções: cadastrais + bancário + PIX). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { supplierServer } from '../../supplier.composition.ts'
import { CreateSupplierInputSchema } from "#modules/partners/server/adapters/supplier.io-schemas.ts"
import type { SupplierDetail } from "#modules/partners/server/domain/supplier/supplier.io.ts"
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type CreateSupplierFnResult =
  | Readonly<{ ok: true; data: SupplierDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const createSupplierFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateSupplierInputSchema)
  .handler(async ({ data }): Promise<CreateSupplierFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await supplierServer().createSupplier(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
