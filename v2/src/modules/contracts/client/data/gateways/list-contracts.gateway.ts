import { contractsRepository } from '../repository/contracts.repository.instance.ts'
import type { ListContractsInput, ListContractsResponse } from '../model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import type { Result } from '#shared/primitives/result.ts'

export const listContractsGateway = (input: ListContractsInput): Promise<Result<ListContractsResponse, ContractsError>> =>
  contractsRepository.list(input)
