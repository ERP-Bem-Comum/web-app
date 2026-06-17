/**
 * Mutation options do AJUSTE de documento (PATCH /:id) — AGNÓSTICO (puro). Sobre o repository.
 * Espelha `create-document.mutation.ts`.
 */
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { AdjustDocumentInput } from '#modules/financial/client/data/model/document.model.ts'

export const adjustDocumentMutationKey = ['financial', 'documents', 'adjust'] as const

export const adjustDocumentMutationOptions = {
  mutationKey: adjustDocumentMutationKey,
  mutationFn: (input: AdjustDocumentInput) => financialRepository.adjust(input),
}
