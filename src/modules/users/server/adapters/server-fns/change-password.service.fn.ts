/**
 * Server function: trocar a própria senha (POST /api/v2/auth/change-password). Re-autentica com a senha
 * atual; o core-api revoga TODAS as sessões após a troca → o front faz logout em seguida.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { usersServer } from '../users.composition.ts'
import { ChangePasswordInputSchema } from '#modules/users/server/adapters/users.io-schemas.ts'
import type { UsersError } from '#modules/users/server/domain/errors/users.errors.ts'

export type ChangePasswordFnResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; error: UsersError }>

export const changePasswordFn = createServerFn({ method: 'POST' })
  .inputValidator(ChangePasswordInputSchema)
  .handler(async ({ data }): Promise<ChangePasswordFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await usersServer().changePassword(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true }
  })
