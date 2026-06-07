/**
 * Mutation options da criação de financiador — AGNÓSTICO (puro). Sobre o repository.
 */
import { financierRepository } from '#modules/partners/client/data/repository/financier.repository.instance.ts'
import type { FinancierWriteInput } from '#modules/partners/client/data/model/financier.model.ts'

export const financierCreateMutationKey = ['financiers', 'create'] as const

export const financierCreateMutationOptions = {
  mutationKey: financierCreateMutationKey,
  mutationFn: (input: FinancierWriteInput) => financierRepository.create(input),
}
