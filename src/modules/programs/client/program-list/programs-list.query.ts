/**
 * Query options da listagem de Programas — AGNÓSTICO (puro). Sobre o repository.
 */
import { programsRepository } from '#modules/programs/client/data/repository/programs.repository.instance.ts'
import type { ListProgramsInput } from '#modules/programs/client/data/model/program.model.ts'

export const programsListQueryKey = (input: ListProgramsInput) => ['programs', 'list', input] as const

export const programsListQueryOptions = (input: ListProgramsInput) => ({
  queryKey: programsListQueryKey(input),
  queryFn: () => programsRepository.list(input),
})
