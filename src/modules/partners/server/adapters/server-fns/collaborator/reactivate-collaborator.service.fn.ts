/**
 * Server function: reativar colaborador (Inactive → Active, idempotente). Fronteira RPC (ADR-0010,
 * service.fn). Devolve o colaborador COMPLETO já atualizado (o client core-api refaz o detalhe após o
 * POST) — o client só troca o cache, sem refetch manual.
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { collaboratorServer } from '../../collaborator.composition.ts'
import { ReactivateCollaboratorInputSchema } from "#modules/partners/server/adapters/collaborator.io-schemas.ts"
import type { CollaboratorDetail } from "#modules/partners/server/domain/collaborator/collaborator.io.ts"
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type ReactivateCollaboratorFnResult =
  | Readonly<{ ok: true; data: CollaboratorDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const reactivateCollaboratorFn = createServerFn({ method: 'POST' })
  .inputValidator(ReactivateCollaboratorInputSchema)
  .handler(async ({ data }): Promise<ReactivateCollaboratorFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await collaboratorServer().reactivateCollaborator(data.id, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
