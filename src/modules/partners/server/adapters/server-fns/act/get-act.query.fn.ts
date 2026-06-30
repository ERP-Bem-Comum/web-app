/**
 * Server function: detalhe de um Act por id. Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { actServer } from '../../act.composition.ts'
import { GetActInputSchema } from "#modules/partners/server/adapters/act.io-schemas.ts"
import type { ActDetail } from "#modules/partners/server/domain/act/act.io.ts"
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type GetActFnResult =
  | Readonly<{ ok: true; data: ActDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const getActFn = createServerFn({ method: 'GET' })
  .inputValidator(GetActInputSchema)
  .handler(async ({ data }): Promise<GetActFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await actServer().getAct(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
