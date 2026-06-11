/**
 * Server function: editar meu perfil (PUT /api/v1/me). Aceita só name + telephone (autosserviço).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { usersServer } from '../users.composition.ts'
import { UpdateMeInputSchema } from '#modules/users/server/adapters/users.io-schemas.ts'
import type { UserDetail } from '#modules/users/server/domain/user.io.ts'
import type { UsersError } from '#modules/users/server/domain/errors/users.errors.ts'

export type UpdateMeFnResult =
  | Readonly<{ ok: true; data: UserDetail }>
  | Readonly<{ ok: false; error: UsersError }>

export const updateMeFn = createServerFn({ method: 'POST' })
  .inputValidator(UpdateMeInputSchema)
  .handler(async ({ data }): Promise<UpdateMeFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await usersServer().updateMe(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
