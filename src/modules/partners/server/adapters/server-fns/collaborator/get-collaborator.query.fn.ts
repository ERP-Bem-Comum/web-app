/**
 * Server function: detalhe de um colaborador. Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { collaboratorServer } from '../../collaborator.composition.ts'
import {
  GetCollaboratorInputSchema,
  type CollaboratorDetail,
} from '#modules/partners/server/domain/collaborator/collaborator.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type GetCollaboratorFnResult =
  | Readonly<{ ok: true; data: CollaboratorDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const getCollaboratorFn = createServerFn({ method: 'GET' })
  .inputValidator(GetCollaboratorInputSchema)
  .handler(async ({ data }): Promise<GetCollaboratorFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await collaboratorServer().getCollaborator(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
