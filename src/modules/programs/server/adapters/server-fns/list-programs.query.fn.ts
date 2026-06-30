/**
 * Server function: listar Programas (GET /api/v1/programs). Fronteira RPC (Princ. I). Autentica via
 * sessão, valida input com Zod, chama o use-case.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { programsServer } from '../programs.composition.ts'
import { ListProgramsInputSchema } from '#modules/programs/server/adapters/programs.io-schemas.ts'
import type { ProgramListResponse } from '#modules/programs/server/domain/program.io.ts'
import type { ProgramsError } from '#modules/programs/server/domain/errors/programs.errors.ts'

export type ListProgramsFnResult =
  | Readonly<{ ok: true; data: ProgramListResponse }>
  | Readonly<{ ok: false; error: ProgramsError }>

export const listProgramsFn = createServerFn({ method: 'GET' })
  .inputValidator(ListProgramsInputSchema)
  .handler(async ({ data }): Promise<ListProgramsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await programsServer().listPrograms(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
