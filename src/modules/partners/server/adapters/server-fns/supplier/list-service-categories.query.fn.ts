/**
 * Server function: catálogo de categorias de serviço (39 códigos legados). Sem input. Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { supplierServer } from '../../supplier.composition.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type ListServiceCategoriesFnResult =
  | Readonly<{ ok: true; data: readonly string[] }>
  | Readonly<{ ok: false; error: PartnersError }>

export const listServiceCategoriesFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ListServiceCategoriesFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await supplierServer().listServiceCategories(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
