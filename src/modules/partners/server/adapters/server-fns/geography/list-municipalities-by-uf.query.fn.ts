/**
 * Server function: listar Municípios de uma UF (com `isPartner`). `uf` é OBRIGATÓRIO. Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { geographyServer } from '../../geography.composition.ts'
import { ListMunicipalitiesByUfInputSchema } from '#modules/partners/server/domain/geography/geography.io.ts'
import type { PartnerMunicipality } from '#modules/partners/server/domain/geography/geography.types.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type ListMunicipalitiesByUfFnResult =
  | Readonly<{ ok: true; data: readonly PartnerMunicipality[] }>
  | Readonly<{ ok: false; error: PartnersError }>

export const listMunicipalitiesByUfFn = createServerFn({ method: 'GET' })
  .inputValidator(ListMunicipalitiesByUfInputSchema)
  .handler(async ({ data }): Promise<ListMunicipalitiesByUfFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await geographyServer().listMunicipalitiesByUf(data.uf, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
