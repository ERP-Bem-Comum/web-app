import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { CancelContractInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const cancelContractMutationOptions = {
  mutationKey: ['contracts', 'cancel-contract'] as const,
  mutationFn: (input: CancelContractInput) => contractsRepository.cancelContract(input),
}
