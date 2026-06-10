/**
 * Server function: meu perfil (GET /api/v1/me). Autosserviço — o id vem da sessão (sem param).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { usersServer } from '../users.composition.ts'
import type { UserDetail } from '#modules/users/server/domain/user.io.ts'
import type { UsersError } from '#modules/users/server/domain/errors/users.errors.ts'

export type GetMeFnResult =
  | Readonly<{ ok: true; data: UserDetail }>
  | Readonly<{ ok: false; error: UsersError }>

export const getMeFn = createServerFn({ method: 'GET' }).handler(async (): Promise<GetMeFnResult> => {
  const user = await getCurrentUserFn()
  if (user === null) return { ok: false, error: 'unauthorized' }
  const accessToken = await resolveAccessTokenFn()
  if (accessToken === null) return { ok: false, error: 'unauthorized' }

  const r = await usersServer().getMe(accessToken)
  if (isErr(r)) return { ok: false, error: r.error }
  return { ok: true, data: r.value }
})
