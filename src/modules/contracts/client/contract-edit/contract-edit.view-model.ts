import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { contractEditMutationOptions } from './contract-edit.mutation.ts'

export const contractEditViewModel = {
  mutation: contractEditMutationOptions,
  onSuccess: () => { /* invalidar query de detalhe */ },
  toErrorTag: (error: ContractsError): string => contractsErrorTag(error),
  unexpectedErrorTag: 'contracts.error.unexpected',
}
