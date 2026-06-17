/**
 * Mutation options do Lançar Documento — AGNÓSTICO (puro). Sobre o repository. Espelha
 * `users-create.mutation.ts`.
 */
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { CreateDocumentInput } from '#modules/financial/client/data/model/document.model.ts'

export const createDocumentMutationKey = ['financial', 'documents', 'create'] as const

export const createDocumentMutationOptions = {
  mutationKey: createDocumentMutationKey,
  mutationFn: (input: CreateDocumentInput) => financialRepository.create(input),
}
