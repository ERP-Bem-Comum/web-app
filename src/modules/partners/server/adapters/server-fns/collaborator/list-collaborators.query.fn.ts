/**
 * Server function: listar colaboradores. Fronteira RPC (Princ. I). Autentica via sessão (auth guard),
 * valida input com Zod, chama o use-case. Retorna `{ ok, data } | { ok, error }`.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { collaboratorServer } from '../../collaborator.composition.ts'
import { ListCollaboratorsInputSchema } from "#modules/partners/server/adapters/collaborator.io-schemas.ts"
import type { CollaboratorListResponse } from "#modules/partners/server/domain/collaborator/collaborator.io.ts"
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type ListCollaboratorsFnResult =
  | Readonly<{ ok: true; data: CollaboratorListResponse }>
  | Readonly<{ ok: false; error: PartnersError }>

export const listCollaboratorsFn = createServerFn({ method: 'GET' })
  .inputValidator(ListCollaboratorsInputSchema)
  .handler(async ({ data }): Promise<ListCollaboratorsFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await collaboratorServer().listCollaborators(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
