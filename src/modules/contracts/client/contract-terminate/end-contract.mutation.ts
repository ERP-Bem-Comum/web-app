import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'

export const endContractMutationOptions = {
  mutationKey: ['contracts', 'end-contract'] as const,
  mutationFn: (input: { contractId: string }) => contractsRepository.endContract(input.contractId),
}
