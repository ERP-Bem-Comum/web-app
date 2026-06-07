/**
 * Server function: marcar/desmarcar um Estado parceiro (toggle idempotente; devolve o DTO `{uf,isPartner}`
 * para atualização otimista). `isPartner` decide POST (ativar) / DELETE (desativar). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { geographyServer } from '../../geography.composition.ts'
import { TogglePartnerStateInputSchema } from '#modules/partners/server/domain/geography/geography.io.ts'
import type { PartnerState } from '#modules/partners/server/domain/geography/geography.types.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type TogglePartnerStateFnResult =
  | Readonly<{ ok: true; data: PartnerState }>
  | Readonly<{ ok: false; error: PartnersError }>

export const togglePartnerStateFn = createServerFn({ method: 'POST' })
  .inputValidator(TogglePartnerStateInputSchema)
  .handler(async ({ data }): Promise<TogglePartnerStateFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await geographyServer().togglePartnerState(data.uf, data.isPartner, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
