/**
 * Server function: minha foto de perfil (GET /api/v1/me/photo) — corpo BINÁRIO. Bytes viajam em base64
 * no envelope RPC; o client vira data URL. "Sem foto" (404 → 'not-found') → `data: null` (mostra iniciais).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { usersServer } from '../users.composition.ts'
import type { UsersError } from '#modules/users/server/domain/errors/users.errors.ts'

export type GetUserPhotoFnResult =
  | Readonly<{ ok: true; data: Readonly<{ base64: string; contentType: string }> | null }>
  | Readonly<{ ok: false; error: UsersError }>

export const getMyPhotoFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<GetUserPhotoFnResult> => {
    try {
      const user = await getCurrentUserFn()
      if (user === null) return { ok: false, error: 'unauthorized' }
      const accessToken = await resolveAccessTokenFn()
      if (accessToken === null) return { ok: false, error: 'unauthorized' }

      const r = await usersServer().getMyPhoto(accessToken)
      if (isErr(r)) {
        return r.error === 'not-found' ? { ok: true, data: null } : { ok: false, error: r.error }
      }
      return {
        ok: true,
        data: { base64: Buffer.from(r.value.bytes).toString('base64'), contentType: r.value.contentType },
      }
    } catch {
      return { ok: false, error: 'server' }
    }
  },
)
