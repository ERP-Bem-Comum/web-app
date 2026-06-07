/**
 * Server function: pré-cadastro de Act (7 campos → situação Pré Cadastrado). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { actServer } from '../../act.composition.ts'
import { CreateActInputSchema, type ActDetail } from '#modules/partners/server/domain/act/act.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type CreateActFnResult =
  | Readonly<{ ok: true; data: ActDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const createActFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateActInputSchema)
  .handler(async ({ data }): Promise<CreateActFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await actServer().createAct(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
