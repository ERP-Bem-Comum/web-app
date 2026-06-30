/**
 * Server function: desativar um Act (idempotente, SEM motivo — o core-api não recebe body). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { actServer } from '../../act.composition.ts'
import { DeactivateActInputSchema } from "#modules/partners/server/adapters/act.io-schemas.ts"
import type { ActDetail } from "#modules/partners/server/domain/act/act.io.ts"
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type DeactivateActFnResult =
  | Readonly<{ ok: true; data: ActDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const deactivateActFn = createServerFn({ method: 'POST' })
  .inputValidator(DeactivateActInputSchema)
  .handler(async ({ data }): Promise<DeactivateActFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await actServer().deactivateAct(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
