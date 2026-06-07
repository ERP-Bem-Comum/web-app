/**
 * Mutation de atualização de financiador — AGNÓSTICO (puro). Sobre o repository. PUT total (6 campos + id).
 */
import { financierRepository } from '#modules/partners/client/data/repository/financier.repository.instance.ts'
import type { FinancierWriteInput } from '#modules/partners/client/data/model/financier.model.ts'

export const financierUpdateMutationKey = ['financiers', 'update'] as const

export const financierUpdateMutationOptions = {
  mutationKey: financierUpdateMutationKey,
  mutationFn: (input: FinancierWriteInput & Readonly<{ id: string }>) =>
    financierRepository.update(input),
}
