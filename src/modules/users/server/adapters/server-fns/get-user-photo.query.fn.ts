/**
 * Server function: foto de um usuário (GET /api/v1/users/:id/photo, admin) — corpo BINÁRIO.
 * Bytes em base64; "sem foto" (404 → 'not-found') → `data: null`.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { usersServer } from '../users.composition.ts'
import type { GetUserPhotoFnResult } from './get-my-photo.query.fn.ts'

export const getUserPhotoFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string().trim().min(1) }))
  .handler(async ({ data }): Promise<GetUserPhotoFnResult> => {
    try {
      const user = await getCurrentUserFn()
      if (user === null) return { ok: false, error: 'unauthorized' }
      const accessToken = await resolveAccessTokenFn()
      if (accessToken === null) return { ok: false, error: 'unauthorized' }

      const r = await usersServer().getUserPhoto(data.id, accessToken)
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
  })
