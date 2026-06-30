/**
 * Server function: detalhe de Programa (GET /api/v1/programs/:id).
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { programsServer } from '../programs.composition.ts'
import type { ProgramDetail } from '#modules/programs/server/domain/program.io.ts'
import type { ProgramsError } from '#modules/programs/server/domain/errors/programs.errors.ts'

export type GetProgramFnResult =
  | Readonly<{ ok: true; data: ProgramDetail }>
  | Readonly<{ ok: false; error: ProgramsError }>

export const getProgramFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string().trim().min(1) }))
  .handler(async ({ data }): Promise<GetProgramFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await programsServer().getProgram(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
