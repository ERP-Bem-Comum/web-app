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
  createCompleteCollaboratorRegistration,
  createUpdateCollaborator,
  createDeactivateCollaborator,
  createImportCollaborators,
} from '#modules/partners/server/application/collaborator/collaborator.use-cases.ts'

type CollaboratorServer = ReturnType<typeof build>

// CORE_API_URL inclui o prefixo de versão (auth/contracts usam /api/v2). Parceiros vivem em /api/v1
// (ADR-0033). Deriva de forma robusta: troca o /api/v2 se presente; senão anexa /api/v1.
const derivePartnersBase = (coreApiUrl: string): string =>
  coreApiUrl.includes('/api/v2')
    ? coreApiUrl.replace('/api/v2', '/api/v1')
    : `${coreApiUrl.replace(/\/+$/, '')}/api/v1`

const build = () => {
  const env = loadEnvOrThrow()
  const client = createCoreApiCollaboratorsClient(derivePartnersBase(env.CORE_API_URL))
  return {
    listCollaborators: createListCollaborators({ client }),
    getCollaborator: createGetCollaborator({ client }),
    createCollaborator: createCreateCollaborator({ client }),
    completeCollaboratorRegistration: createCompleteCollaboratorRegistration({ client }),
    updateCollaborator: createUpdateCollaborator({ client }),
    deactivateCollaborator: createDeactivateCollaborator({ client }),
    importCollaborators: createImportCollaborators({ client }),
  }
}

let cached: CollaboratorServer | undefined
export const collaboratorServer = (): CollaboratorServer => (cached ??= build())
