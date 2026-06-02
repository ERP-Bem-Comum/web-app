import { isOk } from '#shared/primitives/result.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { contractEditMutationOptions } from './contract-edit.mutation.ts'

export const contractEditViewModel = {
  mutation: contractEditMutationOptions,
  onSuccess: () => { /* invalidar query de detalhe */ },
  toErrorTag: (error: ContractsError): string => contractsErrorTag(error),
  unexpectedErrorTag: 'contracts.error.unexpected',
}
