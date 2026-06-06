/**
 * Server function: pré-cadastro de colaborador (7 campos → situação Pré Cadastrado). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { collaboratorServer } from '../../collaborator.composition.ts'
import {
  CreateCollaboratorInputSchema,
  type CollaboratorDetail,
} from '#modules/partners/server/domain/collaborator/collaborator.io.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type CreateCollaboratorFnResult =
  | Readonly<{ ok: true; data: CollaboratorDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const createCollaboratorFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateCollaboratorInputSchema)
  .handler(async ({ data }): Promise<CreateCollaboratorFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await collaboratorServer().createCollaborator(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
