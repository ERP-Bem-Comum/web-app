/**
 * Server function: listar Acts. Fronteira RPC (Princ. I). Autentica via sessão (auth guard),
 * valida input com Zod, chama o use-case. Retorna `{ ok, data } | { ok, error }`.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { actServer } from '../../act.composition.ts'
import { ListActsInputSchema, type ActListResponse } from '#modules/partners/server/domain/act/act.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type ListActsFnResult =
  | Readonly<{ ok: true; data: ActListResponse }>
  | Readonly<{ ok: false; error: PartnersError }>

export const listActsFn = createServerFn({ method: 'GET' })
  .inputValidator(ListActsInputSchema)
  .handler(async ({ data }): Promise<ListActsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await actServer().listActs(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
