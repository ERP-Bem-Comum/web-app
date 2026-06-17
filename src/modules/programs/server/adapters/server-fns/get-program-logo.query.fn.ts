/**
 * Server function: logo de Programa (GET /api/v1/programs/:id/logo) — corpo BINÁRIO.
 * Os bytes viajam como base64 no envelope RPC (JSON); o client decodifica para data/object URL.
 * "Sem logo" (404 do core-api → 'not-found') NÃO é erro: vira `data: null` p/ a UI mostrar placeholder.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { programsServer } from '../programs.composition.ts'
import type { ProgramsError } from '#modules/programs/server/domain/errors/programs.errors.ts'

export type GetProgramLogoFnResult =
  | Readonly<{ ok: true; data: Readonly<{ base64: string; contentType: string }> | null }>
  | Readonly<{ ok: false; error: ProgramsError }>

export const getProgramLogoFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string().trim().min(1) }))
  .handler(async ({ data }): Promise<GetProgramLogoFnResult> => {
    try {
      const user = await getCurrentUserFn()
      if (user === null) return { ok: false, error: 'unauthorized' }
      const accessToken = await resolveAccessTokenFn()
      if (accessToken === null) return { ok: false, error: 'unauthorized' }

      const r = await programsServer().getLogo(data.id, accessToken)
      if (isErr(r)) {
        // Sem logo (404) → sinaliza "vazio" p/ a UI; demais erros sobem.
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
