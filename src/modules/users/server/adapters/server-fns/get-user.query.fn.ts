/**
 * Server function: detalhe de Usuário (GET /api/v1/users/:id). Fronteira RPC (Princ. I). Autentica via
 * sessão, valida o id, chama o use-case. Retorna `{ ok, data } | { ok, error }`.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { usersServer } from '../users.composition.ts'
import type { UserDetail } from '#modules/users/server/domain/user.io.ts'
import type { UsersError } from '#modules/users/server/domain/errors/users.errors.ts'

export type GetUserFnResult =
  | Readonly<{ ok: true; data: UserDetail }>
  | Readonly<{ ok: false; error: UsersError }>

export const getUserFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string().trim().min(1) }))
  .handler(async ({ data }): Promise<GetUserFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await usersServer().getUser(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
