/**
 * Server function: upload do logo de Programa (POST /api/v1/programs/:id/logo) — corpo BINÁRIO cru.
 * O client envia o arquivo como base64; aqui validamos na borda (MIME/tamanho/magic) e repassamos os
 * bytes ao core-api com o MIME no Content-Type. Retorna { logoKey }. Errors-as-values (ADR-0002).
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { programsServer } from '../programs.composition.ts'
import { validateProgramLogo } from '../program-logo.validation.ts'
import type { ProgramsError } from '#modules/programs/server/domain/errors/programs.errors.ts'

const InputSchema = z.object({
  id: z.string().trim().min(1),
  fileBase64: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
})

export type UploadProgramLogoFnResult =
  | Readonly<{ ok: true; data: Readonly<{ logoKey: string }> }>
  | Readonly<{ ok: false; error: ProgramsError }>

export const uploadProgramLogoFn = createServerFn({ method: 'POST' })
  .inputValidator(InputSchema)
  .handler(async ({ data }): Promise<UploadProgramLogoFnResult> => {
    try {
      const user = await getCurrentUserFn()
      if (user === null) return { ok: false, error: 'unauthorized' }
      const accessToken = await resolveAccessTokenFn()
      if (accessToken === null) return { ok: false, error: 'unauthorized' }

      const validated = validateProgramLogo(data.fileBase64, data.mimeType)
      if (isErr(validated)) return { ok: false, error: validated.error }

      const r = await programsServer().uploadLogo(
        data.id,
        { bytes: validated.value.bytes, mimeType: validated.value.mimeType },
        accessToken,
      )
      if (isErr(r)) return { ok: false, error: r.error }
      return { ok: true, data: r.value }
    } catch {
      return { ok: false, error: 'server' }
    }
  })
