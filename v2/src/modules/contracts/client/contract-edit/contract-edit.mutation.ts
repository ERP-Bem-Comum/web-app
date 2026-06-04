import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { UpdateContractInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const contractEditMutationKey = ['contracts', 'edit'] as const

export const contractEditMutationOptions = {
  mutationKey: contractEditMutationKey,
  mutationFn: (input: UpdateContractInput) => contractsRepository.update(input),
}
