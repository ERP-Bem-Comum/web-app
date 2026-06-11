/**
 * Query options da listagem de Colaboradores — AGNÓSTICO (puro, zero React). Sobre o repository.
 */
import { collaboratorRepository } from '#modules/partners/client/data/repository/collaborator.repository.instance.ts'
import type { CollaboratorListFilters } from '#modules/partners/client/data/collaborator-list-filters.schema.ts'

export const collaboratorListQueryKey = (input: CollaboratorListFilters) =>
  ['collaborators', 'list', input] as const

export const collaboratorListQueryOptions = (input: CollaboratorListFilters) => ({
  queryKey: collaboratorListQueryKey(input),
  // Mapeia os filtros singulares da URL → input do backend (arrays p/ área/vínculo/função).
  queryFn: () =>
    collaboratorRepository.list({
      search: input.search,
      active: input.active,
      status: input.status,
      occupationAreas: input.area ? [input.area] : undefined,
      employmentRelationships: input.employment ? [input.employment] : undefined,
      roles: input.role ? [input.role] : undefined,
      yearOfContract: input.year,
      page: input.page,
      limit: input.limit,
    }),
  // Mantém a página atual visível enquanto a próxima carrega (não pisca loading ao paginar) — A6.
  // Equivalente a `keepPreviousData`, sem importar do react-query (núcleo agnóstico, ADR-0009).
  placeholderData: <T,>(previous: T): T => previous,
  // Evita refetch agressivo (foco/montagem) durante a navegação da lista — M1.
  staleTime: 30_000,
})
