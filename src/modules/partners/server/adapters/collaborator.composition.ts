/**
 * Composition root do server/collaborator. Monta os use-cases com o client real. Env lido DENTRO
 * da função (nunca em escopo de módulo). Parceiros vivem em `/api/v1` (ADR-0033) — derivamos a base
 * do `CORE_API_URL` (que inclui o prefixo `/api/v2` usado por auth/contracts).
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { createCoreApiCollaboratorsClient } from './core-api/core-api-collaborators.ts'
import {
  createListCollaborators,
  createGetCollaborator,
  createCreateCollaborator,
  createDeactivateCollaborator,
} from '#modules/partners/server/application/collaborator/collaborator.use-cases.ts'

type CollaboratorServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const baseUrl = env.CORE_API_URL.replace(/\/api\/v2\/?$/, '/api/v1')
  const client = createCoreApiCollaboratorsClient(baseUrl)
  return {
    listCollaborators: createListCollaborators({ client }),
    getCollaborator: createGetCollaborator({ client }),
    createCollaborator: createCreateCollaborator({ client }),
    deactivateCollaborator: createDeactivateCollaborator({ client }),
  }
}

let cached: CollaboratorServer | undefined
export const collaboratorServer = (): CollaboratorServer => (cached ??= build())
