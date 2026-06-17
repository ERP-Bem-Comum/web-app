/**
 * Server function: trocar a foto de um usuário (PUT /api/v1/users/:id/photo, admin) — corpo BINÁRIO.
 * Client envia base64; validamos na borda e repassamos os bytes. Errors-as-values.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { usersServer } from '../users.composition.ts'
import { validateUserPhoto } from '../user-photo.validation.ts'
import type { UploadPhotoFnResult } from './upload-my-photo.service.fn.ts'

const InputSchema = z.object({
  id: z.string().trim().min(1),
  fileBase64: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
})

export const uploadUserPhotoFn = createServerFn({ method: 'POST' })
  .inputValidator(InputSchema)
  .handler(async ({ data }): Promise<UploadPhotoFnResult> => {
    try {
      const user = await getCurrentUserFn()
      if (user === null) return { ok: false, error: 'unauthorized' }
      const accessToken = await resolveAccessTokenFn()
      if (accessToken === null) return { ok: false, error: 'unauthorized' }

      const validated = validateUserPhoto(data.fileBase64, data.mimeType)
      if (isErr(validated)) return { ok: false, error: validated.error }

      const r = await usersServer().uploadUserPhoto(
        data.id,
        { bytes: validated.value.bytes, mimeType: validated.value.mimeType },
        accessToken,
      )
      if (isErr(r)) return { ok: false, error: r.error }
      return { ok: true }
    } catch {
      return { ok: false, error: 'server' }
    }
  })
