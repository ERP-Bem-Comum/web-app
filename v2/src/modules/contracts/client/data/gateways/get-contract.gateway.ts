import { contractsRepository } from '../repository/contracts.repository.instance.ts'
import type { Contract } from '../model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Result } from '#shared/primitives/result.ts'

export const getContractGateway = (id: string): Promise<Result<Contract, ContractsError>> =>
  contractsRepository.getById(id)
