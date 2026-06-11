import { isOk, type Result } from '#shared/primitives/result.ts'
import type { ContractsError } from '#modules/contracts/client/data/repository/contracts.repository.ts'
import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { contractsErrorTag } from '#modules/contracts/client/data/helpers/contracts-error-tag.ts'
import { attachSignedDocumentMutationOptions } from './attach-signed-document.mutation.ts'

export const attachSignedDocumentViewModel = {
  mutation: attachSignedDocumentMutationOptions,

  onSuccess: (result: Result<Contract, ContractsError>): void => {
    if (isOk(result)) {
      // Sucesso: contrato efetivado (Em Andamento). A invalidação de queries é responsabilidade do binding.
    }
  },

  toErrorTag: (error: ContractsError): string => contractsErrorTag(error),
  unexpectedErrorTag: 'contracts.attach.error.failed',
}
