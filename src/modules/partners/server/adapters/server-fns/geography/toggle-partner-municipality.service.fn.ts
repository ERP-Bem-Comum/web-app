/**
 * Server function: marcar/desmarcar um Município parceiro (toggle idempotente; devolve o DTO
 * `{ibgeCode,uf,name,isPartner}`). Identidade por `ibgeCode`. `isPartner` decide POST/DELETE. Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { geographyServer } from '../../geography.composition.ts'
import { TogglePartnerMunicipalityInputSchema } from '#modules/partners/server/domain/geography/geography.io.ts'
import type { PartnerMunicipality } from '#modules/partners/server/domain/geography/geography.types.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type TogglePartnerMunicipalityFnResult =
  | Readonly<{ ok: true; data: PartnerMunicipality }>
  | Readonly<{ ok: false; error: PartnersError }>

export const togglePartnerMunicipalityFn = createServerFn({ method: 'POST' })
  .inputValidator(TogglePartnerMunicipalityInputSchema)
  .handler(async ({ data }): Promise<TogglePartnerMunicipalityFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await geographyServer().togglePartnerMunicipality(data.ibgeCode, data.isPartner, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
