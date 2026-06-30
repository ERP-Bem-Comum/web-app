/**
 * Server function: editar Programa (PUT /api/v1/programs/:id). Envia `version` (optimistic-lock):
 * conflito → `program-version-conflict` (409). RBAC `program:write` cobrado pelo core-api.
 */
import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { programsServer } from '../programs.composition.ts'
import { UpdateProgramInputSchema } from '#modules/programs/server/adapters/programs.io-schemas.ts'
import type { ProgramDetail } from '#modules/programs/server/domain/program.io.ts'
import type { ProgramsError } from '#modules/programs/server/domain/errors/programs.errors.ts'

const UpdateProgramFnInputSchema = z.object({
  id: z.string().trim().min(1),
  ...UpdateProgramInputSchema.shape,
})

export type UpdateProgramFnResult =
  | Readonly<{ ok: true; data: ProgramDetail }>
  | Readonly<{ ok: false; error: ProgramsError }>

export const updateProgramFn = createServerFn({ method: 'POST' })
  .inputValidator(UpdateProgramFnInputSchema)
  .handler(async ({ data }): Promise<UpdateProgramFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const { id, ...input } = data
    const r = await programsServer().updateProgram(id, input, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
