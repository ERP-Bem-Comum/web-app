/**
 * Mutation options da criação de ACT — AGNÓSTICO (puro). Sobre o repository.
 */
import { actRepository } from '#modules/partners/client/data/repository/act.repository.instance.ts'
import type { ActWriteInput } from '#modules/partners/client/data/model/act.model.ts'

export const actCreateMutationKey = ['acts', 'create'] as const

export const actCreateMutationOptions = {
  mutationKey: actCreateMutationKey,
  mutationFn: (input: ActWriteInput) => actRepository.create(input),
}
