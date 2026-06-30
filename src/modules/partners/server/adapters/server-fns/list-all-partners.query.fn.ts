/**
 * listAllPartnersFn — fronteira (query.fn) do agregador de parceiros. Autentica via sessão e delega ao
 * adapter do core-api (`GET /api/v1/partners`), devolvendo a lista unificada dos 4 tipos com `document`
 * (CPF/CNPJ) já resolvido. Sem input. O client (binding) só consome — não compõe.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import {
  listAllPartners,
  type PartnerAggregateItem,
  type PartnerAggregateError,
} from '#modules/partners/server/adapters/core-api/core-api-partners-aggregate.ts'

export type ListAllPartnersFnResult =
  | Readonly<{ ok: true; data: readonly PartnerAggregateItem[] }>
  | Readonly<{ ok: false; error: PartnerAggregateError }>

export const listAllPartnersFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ListAllPartnersFnResult> => {
    const user = await getCurrentUserFn()
    const token = await resolveAccessTokenFn()
    if (user === null || token === null) return { ok: false, error: 'unauthorized' }

    const r = await listAllPartners(token)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
