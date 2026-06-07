/**
 * Server function: listar Estados parceiros (27 UFs com `isPartner`). Sem input. Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { geographyServer } from '../../geography.composition.ts'
import type { PartnerState } from '#modules/partners/server/domain/geography/geography.types.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type ListPartnerStatesFnResult =
  | Readonly<{ ok: true; data: readonly PartnerState[] }>
  | Readonly<{ ok: false; error: PartnersError }>

export const listPartnerStatesFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ListPartnerStatesFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await geographyServer().listPartnerStates(accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  },
)
