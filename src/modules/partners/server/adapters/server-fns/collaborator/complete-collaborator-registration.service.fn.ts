/**
 * Server function: completar o cadastro do colaborador (Seção 2 — promove Pré → Cadastrado, FR-004).
 * Fronteira RPC. Valida input Zod, autentica, chama o use-case (core-api PATCH complete-registration).
 */
import { createServerFn } from '@tanstack/react-start'

import { isErr } from '#shared/primitives/result.ts'
import { getCurrentUserFn, resolveAccessTokenFn } from '#modules/auth/public-api/index.ts'
import { collaboratorServer } from '../../collaborator.composition.ts'
import { CompleteCollaboratorRegistrationInputSchema } from "#modules/partners/server/adapters/collaborator.io-schemas.ts"
import type { CollaboratorDetail } from "#modules/partners/server/domain/collaborator/collaborator.io.ts"
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'

export type CompleteCollaboratorRegistrationFnResult =
  | Readonly<{ ok: true; data: CollaboratorDetail }>
  | Readonly<{ ok: false; error: PartnersError }>

export const completeCollaboratorRegistrationFn = createServerFn({ method: 'POST' })
  .inputValidator(CompleteCollaboratorRegistrationInputSchema)
  .handler(async ({ data }): Promise<CompleteCollaboratorRegistrationFnResult> => {
    const user = await getCurrentUserFn()
    if (user === null) return { ok: false, error: 'unauthorized' }
    const accessToken = await resolveAccessTokenFn()
    if (accessToken === null) return { ok: false, error: 'unauthorized' }

    const r = await collaboratorServer().completeCollaboratorRegistration(data, accessToken)
    if (isErr(r)) return { ok: false, error: r.error }
    return { ok: true, data: r.value }
  })
