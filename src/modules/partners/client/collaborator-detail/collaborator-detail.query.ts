/**
 * Query options do detalhe de colaborador — AGNÓSTICO (puro). Sobre o repository.
 */
import { collaboratorRepository } from '#modules/partners/client/data/repository/collaborator.repository.instance.ts'

export const collaboratorDetailQueryKey = (id: string) => ['collaborators', 'detail', id] as const

export const collaboratorDetailQueryOptions = (id: string) => ({
  queryKey: collaboratorDetailQueryKey(id),
  queryFn: () => collaboratorRepository.getById(id),
  staleTime: 30_000,
})
