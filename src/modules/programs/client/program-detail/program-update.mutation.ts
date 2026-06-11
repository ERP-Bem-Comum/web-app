/**
 * Mutation de edição de Programa — AGNÓSTICO (puro). PUT total (campos + version p/ optimistic-lock).
 */
import { programsRepository } from '#modules/programs/client/data/repository/programs.repository.instance.ts'
import type { UpdateProgramInput } from '#modules/programs/client/data/model/program.model.ts'

export const programUpdateMutationKey = ['programs', 'update'] as const

export const programUpdateMutationOptions = {
  mutationKey: programUpdateMutationKey,
  mutationFn: (input: UpdateProgramInput & Readonly<{ id: string }>) => programsRepository.update(input),
}
