/**
 * Server function: listar municípios parceiros de TODAS as UFs (cross-state). Sem input. Fronteira RPC.
 * Acumulação de páginas + Zod + mapeamento vivem no adapter (`geographyServer().listAddedMunicipalities`).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { geographyServer } from '../../geography.composition.ts'
import type { PartnerMunicipality } from '#modules/partners/server/domain/geography/geography.types.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type ListAddedMunicipalitiesFnResult =
  | Readonly<{ ok: true; data: readonly PartnerMunicipality[] }>
  | Readonly<{ ok: false; error: PartnersError }>

export const listAddedMunicipalitiesFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ListAddedMunicipalitiesFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await geographyServer().listAddedMunicipalities(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
