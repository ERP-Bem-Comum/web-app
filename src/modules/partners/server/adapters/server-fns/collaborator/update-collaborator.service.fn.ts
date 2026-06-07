/**
 * Server function: editar os dados cadastrais do colaborador. Fronteira RPC. Valida input Zod,
 * autentica, chama o use-case (core-api PUT /collaborators/:id).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { collaboratorServer } from '../../collaborator.composition.ts'
import {
  UpdateCollaboratorInputSchema,
  type CollaboratorDetail,
} from '#modules/partners/server/domain/collaborator/collaborator.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type UpdateCollaboratorFnResult =
  | Readonly<{ ok: true; data: CollaboratorDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const updateCollaboratorFn = createServerFn({ method: 'POST' })
  .inputValidator(UpdateCollaboratorInputSchema)
  .handler(async ({ data }): Promise<UpdateCollaboratorFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await collaboratorServer().updateCollaborator(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
