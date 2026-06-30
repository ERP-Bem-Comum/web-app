/**
 * Composition root do server/collaborator. Monta os use-cases com o client real. Env lido DENTRO
 * da função (nunca em escopo de módulo). Parceiros vivem em `/api/v1` (ADR-0033) — derivamos a base
 * do `CORE_API_URL` (que inclui o prefixo `/api/v2` usado por auth/contracts).
 */
import { loadEnvOrThrow } from '#external/config/env.config.ts'
import { coreApiBase } from '#external/core-api/api-base.ts'
import { createCoreApiCollaboratorsClient } from './core-api/core-api-collaborators.ts'
import {
  createListCollaborators,
  createGetCollaborator,
  createCreateCollaborator,
  createCompleteCollaboratorRegistration,
  createUpdateCollaborator,
  createDeactivateCollaborator,
  createReactivateCollaborator,
  createImportCollaborators,
} from '#modules/partners/server/application/collaborator/collaborator.use-cases.ts'

type CollaboratorServer = ReturnType<typeof build>

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiCollaboratorsClient(coreApiBase(env.CORE_API_URL, 'v1'))
  return {
    listCollaborators: createListCollaborators({ client }),
    getCollaborator: createGetCollaborator({ client }),
    createCollaborator: createCreateCollaborator({ client }),
    completeCollaboratorRegistration: createCompleteCollaboratorRegistration({ client }),
    updateCollaborator: createUpdateCollaborator({ client }),
    deactivateCollaborator: createDeactivateCollaborator({ client }),
    reactivateCollaborator: createReactivateCollaborator({ client }),
    importCollaborators: createImportCollaborators({ client }),
  }
}

let cached: CollaboratorServer | undefined
export const collaboratorServer = (): CollaboratorServer => (cached ??= build())
