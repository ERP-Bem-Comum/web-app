/**
 * Server function: editar Usuário (PUT /api/v1/users/:id). Fronteira RPC (Princ. I). Autentica via
 * sessão, valida o input (id + campos), chama o use-case. RBAC `user:update` é cobrado pelo core-api.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { usersServer } from '../users.composition.ts'
import { UpdateUserInputSchema } from '#modules/users/server/adapters/users.io-schemas.ts'
import type { UserDetail } from '#modules/users/server/domain/user.io.ts'
import type { UsersError } from '#modules/users/server/domain/errors/users.errors.ts'

const UpdateUserFnInputSchema = z.object({
  id: z.string().trim().min(1),
  ...UpdateUserInputSchema.shape,
})

export type UpdateUserFnResult =
  | Readonly<{ ok: true; data: UserDetail }>
  | Readonly<{ ok: false; error: UsersError }>

export const updateUserFn = createServerFn({ method: 'POST' })
  .inputValidator(UpdateUserFnInputSchema)
  .handler(async ({ data }): Promise<UpdateUserFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const { id, ...input } = data
    const r = await usersServer().updateUser(id, input, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
