/**
 * Server function: desativar colaborador (motivo obrigatório — FR-006). Fronteira RPC.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { collaboratorServer } from '../../collaborator.composition.ts'
import { DeactivateCollaboratorInputSchema } from "#modules/partners/server/adapters/collaborator.io-schemas.ts"
import type { CollaboratorDetail } from "#modules/partners/server/domain/collaborator/collaborator.io.ts"
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type DeactivateCollaboratorFnResult =
  | Readonly<{ ok: true; data: CollaboratorDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const deactivateCollaboratorFn = createServerFn({ method: 'POST' })
  .inputValidator(DeactivateCollaboratorInputSchema)
  .handler(async ({ data }): Promise<DeactivateCollaboratorFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await collaboratorServer().deactivateCollaborator(data.id, data.reason, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
