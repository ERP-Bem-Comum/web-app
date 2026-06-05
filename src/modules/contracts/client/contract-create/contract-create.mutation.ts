import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { CreateContractInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const contractCreateMutationKey = ['contracts', 'create'] as const

export const contractCreateMutationOptions = {
  mutationKey: contractCreateMutationKey,
  mutationFn: (input: CreateContractInput) => contractsRepository.create(input),
}
