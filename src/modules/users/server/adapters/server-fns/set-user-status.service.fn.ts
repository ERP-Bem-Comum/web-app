/**
 * Server function: ativar/desativar Usuário (PATCH /api/v1/users/:id/{activate|deactivate}). Fronteira
 * RPC (Princ. I). Autentica via sessão, valida o input, chama o use-case. RBAC `user:activate` /
 * `user:deactivate` é cobrado pelo core-api.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { usersServer } from '../users.composition.ts'
import type { UserDetail } from '#modules/users/server/domain/user.io.ts'
import type { UsersError } from '#modules/users/server/domain/errors/users.errors.ts'

export type SetUserStatusFnResult =
  | Readonly<{ ok: true; data: UserDetail }>
  | Readonly<{ ok: false; error: UsersError }>

export const setUserStatusFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().trim().min(1), active: z.boolean() }))
  .handler(async ({ data }): Promise<SetUserStatusFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await usersServer().setUserActive(data.id, data.active, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
