/**
 * Server function: editar os 7 campos cadastrais de um Act (PUT). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { actServer } from '../../act.composition.ts'
import { UpdateActInputSchema } from "#modules/partners/server/adapters/act.io-schemas.ts"
import type { ActDetail } from "#modules/partners/server/domain/act/act.io.ts"
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type UpdateActFnResult =
  | Readonly<{ ok: true; data: ActDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const updateActFn = createServerFn({ method: 'POST' })
  .inputValidator(UpdateActInputSchema)
  .handler(async ({ data }): Promise<UpdateActFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await actServer().updateAct(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
