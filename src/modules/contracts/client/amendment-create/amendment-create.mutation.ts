import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { CreateAmendmentInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const amendmentCreateMutationKey = ['contracts', 'amendment', 'create'] as const

export const amendmentCreateMutationOptions = {
  mutationKey: amendmentCreateMutationKey,
  mutationFn: (input: { contractId: string; data: CreateAmendmentInput }) =>
    contractsRepository.createAmendment(input.contractId, input.data),
}
