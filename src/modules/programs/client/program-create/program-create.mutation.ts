/**
 * Mutation options da criação de Programa — AGNÓSTICO (puro). Sobre o repository.
 */
import { programsRepository } from '#modules/programs/client/data/repository/programs.repository.instance.ts'
import type { CreateProgramInput } from '#modules/programs/client/data/model/program.model.ts'

export const programCreateMutationKey = ['programs', 'create'] as const

export const programCreateMutationOptions = {
  mutationKey: programCreateMutationKey,
  mutationFn: (input: CreateProgramInput) => programsRepository.create(input),
}
