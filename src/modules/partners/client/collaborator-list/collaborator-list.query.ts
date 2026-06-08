/**
 * Query options da listagem de Colaboradores — AGNÓSTICO (puro, zero React). Sobre o repository.
 */
import { collaboratorRepository } from '#modules/partners/client/data/repository/collaborator.repository.instance.ts'
import type { CollaboratorListFilters } from '#modules/partners/client/domain/collaborator.schemas.ts'

export const collaboratorListQueryKey = (input: CollaboratorListFilters) =>
  ['collaborators', 'list', input] as const

export const collaboratorListQueryOptions = (input: CollaboratorListFilters) => ({
  queryKey: collaboratorListQueryKey(input),
  queryFn: () => collaboratorRepository.list(input),
})
