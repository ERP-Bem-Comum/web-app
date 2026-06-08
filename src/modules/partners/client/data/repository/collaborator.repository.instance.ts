/**
 * Instância da CollaboratorRepository — wire das server functions reais (import direto de
 * server/adapters — boundary §I/§III). Espelha `act.repository.instance.ts`. As 8 fns já existem
 * no BFF; nada novo no servidor.
 */
import { listCollaboratorsFn } from '#modules/partners/server/adapters/server-fns/collaborator/list-collaborators.query.fn.ts'
import { getCollaboratorFn } from '#modules/partners/server/adapters/server-fns/collaborator/get-collaborator.query.fn.ts'
import { createCollaboratorFn } from '#modules/partners/server/adapters/server-fns/collaborator/create-collaborator.service.fn.ts'
import { completeCollaboratorRegistrationFn } from '#modules/partners/server/adapters/server-fns/collaborator/complete-collaborator-registration.service.fn.ts'
import { updateCollaboratorFn } from '#modules/partners/server/adapters/server-fns/collaborator/update-collaborator.service.fn.ts'
import { deactivateCollaboratorFn } from '#modules/partners/server/adapters/server-fns/collaborator/deactivate-collaborator.service.fn.ts'
import { reactivateCollaboratorFn } from '#modules/partners/server/adapters/server-fns/collaborator/reactivate-collaborator.service.fn.ts'
import { importCollaboratorsFn } from '#modules/partners/server/adapters/server-fns/collaborator/import-collaborators.service.fn.ts'

import { createCollaboratorRepository } from './collaborator.repository.ts'

export const collaboratorRepository = createCollaboratorRepository({
  listCollaboratorsFn: (opts) => listCollaboratorsFn(opts),
  getCollaboratorFn: (opts) => getCollaboratorFn(opts),
  createCollaboratorFn: (opts) => createCollaboratorFn(opts),
  completeCollaboratorRegistrationFn: (opts) => completeCollaboratorRegistrationFn(opts),
  updateCollaboratorFn: (opts) => updateCollaboratorFn(opts),
  deactivateCollaboratorFn: (opts) => deactivateCollaboratorFn(opts),
  reactivateCollaboratorFn: (opts) => reactivateCollaboratorFn(opts),
  importCollaboratorsFn: (opts) => importCollaboratorsFn(opts),
})
