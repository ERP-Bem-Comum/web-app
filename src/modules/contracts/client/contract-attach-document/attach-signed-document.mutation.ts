import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { AttachSignedDocumentInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const attachSignedDocumentMutationKey = ['contracts', 'attach-signed-document'] as const

export const attachSignedDocumentMutationOptions = {
  mutationKey: attachSignedDocumentMutationKey,
  mutationFn: (input: AttachSignedDocumentInput) => contractsRepository.attachSignedDocument(input),
}
