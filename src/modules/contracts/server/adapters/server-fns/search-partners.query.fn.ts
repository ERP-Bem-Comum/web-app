/**
 * searchPartnersFn — fronteira (ADR-0010, query.fn) da BUSCA de parceiros do combobox de contratos.
 * Autentica e delega ao orquestrador (fan-out dos 4 recursos do core-api). Devolve UMA lista pronta;
 * o client não compõe nada.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import {
  searchPartners,
  type PartnerSearchItem,
  type PartnerSearchError,
} from '#modules/contracts/server/adapters/core-api/core-api-partners.ts'

const SearchPartnersInputSchema = z.object({
  query: z.string().trim().optional(),
  kind: z.enum(['Supplier', 'Financier', 'Collaborator', 'ACT']).optional(),
})

export type SearchPartnersFnResult =
  | Readonly<{ ok: true; data: readonly PartnerSearchItem[] }>
  | Readonly<{ ok: false; error: PartnerSearchError }>

export const searchPartnersFn = createServerFn({ method: 'GET' })
  .inputValidator(SearchPartnersInputSchema)
  .handler(async ({ data }): Promise<SearchPartnersFnResult> => {
    const user = await getCurrentUserFn()
    const token = await resolveAccessTokenFn()
    if (user === null || token === null) return { ok: false, error: 'unauthorized' }

    const r = await searchPartners(data.query ?? '', token, data.kind)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
