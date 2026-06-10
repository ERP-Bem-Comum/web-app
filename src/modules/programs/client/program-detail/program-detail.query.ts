/**
 * Query options do detalhe de Programa — AGNÓSTICO (puro). Sobre o repository.
 */
import { programsRepository } from '#modules/programs/client/data/repository/programs.repository.instance.ts'

export const programDetailQueryKey = (id: string) => ['programs', 'detail', id] as const

export const programDetailQueryOptions = (id: string) => ({
  queryKey: programDetailQueryKey(id),
  queryFn: () => programsRepository.getById(id),
})
