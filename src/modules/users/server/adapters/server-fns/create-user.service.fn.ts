/**
 * Server function: criar Usuário (POST /api/v1/users). Fronteira RPC (Princ. I). Autentica via sessão,
 * valida o input com Zod, chama o use-case. Retorna `{ ok, data } | { ok, error }`. O RBAC (`user:create`)
 * é cobrado pelo core-api (403 → 'forbidden').
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { usersServer } from '../users.composition.ts'
import { CreateUserInputSchema } from '#modules/users/server/adapters/users.io-schemas.ts'
import type { CreatedUser } from '#modules/users/server/domain/user.io.ts'
import type { UsersError } from '#modules/users/server/domain/errors/users.errors.ts'

export type CreateUserFnResult =
  | Readonly<{ ok: true; data: CreatedUser }>
  | Readonly<{ ok: false; error: UsersError }>

export const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateUserInputSchema)
  .handler(async ({ data }): Promise<CreateUserFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await usersServer().createUser(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
