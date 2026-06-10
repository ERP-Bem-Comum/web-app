/**
 * Server function: criar Programa (POST /api/v1/programs). RBAC `program:write` cobrado pelo core-api.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { programsServer } from '../programs.composition.ts'
import { CreateProgramInputSchema } from '#modules/programs/server/adapters/programs.io-schemas.ts'
import type { CreatedProgram } from '#modules/programs/server/domain/program.io.ts'
import type { ProgramsError } from '#modules/programs/server/domain/errors/programs.errors.ts'

export type CreateProgramFnResult =
  | Readonly<{ ok: true; data: CreatedProgram }>
  | Readonly<{ ok: false; error: ProgramsError }>

export const createProgramFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateProgramInputSchema)
  .handler(async ({ data }): Promise<CreateProgramFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await programsServer().createProgram(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
