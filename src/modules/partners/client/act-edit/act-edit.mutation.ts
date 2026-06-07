/**
 * Mutation de atualização de ACT — AGNÓSTICO (puro). PUT total (7 campos + id).
 */
import { actRepository } from '#modules/partners/client/data/repository/act.repository.instance.ts'
import type { ActWriteInput } from '#modules/partners/client/data/model/act.model.ts'

export const actUpdateMutationKey = ['acts', 'update'] as const

export const actUpdateMutationOptions = {
  mutationKey: actUpdateMutationKey,
  mutationFn: (input: ActWriteInput & Readonly<{ id: string }>) => actRepository.update(input),
}
