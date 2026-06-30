/**
 * Server function: listar Usuários. Fronteira RPC (Princ. I). Autentica via sessão (auth guard),
 * valida input com Zod, chama o use-case. Retorna `{ ok, data } | { ok, error }`.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { usersServer } from '../users.composition.ts'
import { ListUsersInputSchema } from '#modules/users/server/adapters/users.io-schemas.ts'
import type { UserListResponse } from '#modules/users/server/domain/user.io.ts'
import type { UsersError } from '#modules/users/server/domain/errors/users.errors.ts'

export type ListUsersFnResult =
  | Readonly<{ ok: true; data: UserListResponse }>
  | Readonly<{ ok: false; error: UsersError }>

export const listUsersFn = createServerFn({ method: 'GET' })
  .inputValidator(ListUsersInputSchema)
  .handler(async ({ data }): Promise<ListUsersFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await usersServer().listUsers(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
