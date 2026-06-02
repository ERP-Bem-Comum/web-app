import { contractsRepository } from '../repository/contracts.repository.instance.ts'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { Contract } from '../model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { Result } from '#shared/primitives/result.ts'

export const getContractGateway = (id: string): Promise<Result<Contract, ContractsError>> =>
  contractsRepository.getById(id)
