/**
 * Server function: listar Fornecedores. Fronteira RPC (Princ. I).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { supplierServer } from '../../supplier.composition.ts'
import { ListSuppliersInputSchema, type SupplierListResponse } from '#modules/partners/server/domain/supplier/supplier.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type ListSuppliersFnResult =
  | Readonly<{ ok: true; data: SupplierListResponse }>
  | Readonly<{ ok: false; error: PartnersError }>

export const listSuppliersFn = createServerFn({ method: 'GET' })
  .inputValidator(ListSuppliersInputSchema)
  .handler(async ({ data }): Promise<ListSuppliersFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await supplierServer().listSuppliers(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
