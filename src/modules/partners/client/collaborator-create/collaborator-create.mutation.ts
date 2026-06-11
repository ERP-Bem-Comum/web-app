/**
 * Mutation options da criação de colaborador — AGNÓSTICO (puro). Sobre o repository.
 */
import { collaboratorRepository } from '#modules/partners/client/data/repository/collaborator.repository.instance.ts'
import type { CollaboratorWriteInput } from '#modules/partners/client/data/model/collaborator.model.ts'

export const collaboratorCreateMutationKey = ['collaborators', 'create'] as const

export const collaboratorCreateMutationOptions = {
  mutationKey: collaboratorCreateMutationKey,
  mutationFn: (input: CollaboratorWriteInput) => collaboratorRepository.create(input),
}
