import { isOk } from '#shared/primitives/result.ts'
import type { Amendment } from '#modules/contracts/client/data/model/contracts.model.ts'
import type { ContractsError } from '#modules/contracts/server/domain/errors/contracts.errors.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { amendmentCreateMutationOptions } from './amendment-create.mutation.ts'

export const amendmentCreateViewModel = {
  mutation: amendmentCreateMutationOptions,
  onSuccess: () => { /* invalidar queries */ },
  toErrorTag: (error: ContractsError): string => contractsErrorTag(error),
  unexpectedErrorTag: 'contracts.error.unexpected',
}
