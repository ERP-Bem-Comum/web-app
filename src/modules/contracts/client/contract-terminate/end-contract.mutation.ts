import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { EndContractInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const endContractMutationOptions = {
  mutationKey: ['contracts', 'end-contract'] as const,
  mutationFn: (input: EndContractInput) => contractsRepository.endContract(input),
}
