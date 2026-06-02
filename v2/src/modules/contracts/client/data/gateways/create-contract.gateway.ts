import { contractsRepository } from '../repository/contracts.repository.instance.ts'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { CreateContractInput, Contract } from '../model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { Result } from '#shared/primitives/result.ts'

export const createContractGateway = (input: CreateContractInput): Promise<Result<Contract, ContractsError>> =>
  contractsRepository.create(input)
