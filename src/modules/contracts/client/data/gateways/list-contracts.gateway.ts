import { contractsRepository } from '../repository/contracts.repository.instance.ts'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { ListContractsInput, ListContractsResponse } from '../model/contracts.model.ts'
import type { Result } from '#shared/primitives/result.ts'

export const listContractsGateway = (input: ListContractsInput): Promise<Result<ListContractsResponse, ContractsError>> =>
  contractsRepository.list(input)
