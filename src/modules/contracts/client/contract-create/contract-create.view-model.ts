import { isOk, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { contractCreateMutationOptions } from './contract-create.mutation.ts'

export const contractCreateViewModel = {
  mutation: contractCreateMutationOptions,

  onSuccess: (result: Result<Contract, ContractsError>): void => {
    if (isOk(result)) {
      // Emitir evento de contrato criado (opcional — para invalidar queries)
    }
  },

  toErrorTag: (error: ContractsError): string => contractsErrorTag(error),
  unexpectedErrorTag: 'contracts.error.unexpected',
}
