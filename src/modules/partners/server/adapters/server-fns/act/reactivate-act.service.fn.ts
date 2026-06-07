/**
 * Server function: reativar um Act (idempotente). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { actServer } from '../../act.composition.ts'
import { ReactivateActInputSchema, type ActDetail } from '#modules/partners/server/domain/act/act.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type ReactivateActFnResult =
  | Readonly<{ ok: true; data: ActDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const reactivateActFn = createServerFn({ method: 'POST' })
  .inputValidator(ReactivateActInputSchema)
  .handler(async ({ data }): Promise<ReactivateActFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await actServer().reactivateAct(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
