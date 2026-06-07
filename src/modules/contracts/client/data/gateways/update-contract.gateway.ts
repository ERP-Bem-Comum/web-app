import { contractsRepository } from '../repository/contracts.repository.instance.ts'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { UpdateContractInput, Contract } from '../model/contracts.model.ts'
import type { Result } from '#shared/primitives/result.ts'

export const updateContractGateway = (input: UpdateContractInput): Promise<Result<Contract, ContractsError>> =>
  contractsRepository.update(input)
