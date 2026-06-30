/**
 * Mutation options p/ buscar o conteúdo de um documento (preview/download) — AGNÓSTICA (zero React).
 * Sobre o repository (porta → server fn). O binding decodifica o base64 em Blob no browser.
 */
import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'

export const documentContentMutationOptions = {
  mutationKey: ['contracts', 'document-content'] as const,
  mutationFn: (input: Readonly<{ contractId: string; documentId: string }>) =>
    contractsRepository.getDocumentContent(input),
}
