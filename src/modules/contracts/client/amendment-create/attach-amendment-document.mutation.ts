import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { AttachAmendmentDocumentInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const attachAmendmentDocumentMutationOptions = {
  mutationKey: ['contracts', 'attach-amendment-document'] as const,
  mutationFn: (input: AttachAmendmentDocumentInput) => contractsRepository.attachAmendmentDocument(input),
}
