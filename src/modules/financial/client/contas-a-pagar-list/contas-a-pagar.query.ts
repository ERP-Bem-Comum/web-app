/**
 * contasAPagarQueryOptions — data AGNÓSTICA da listagem (queryFn devolve o `Result`; a view-model
 * ramifica em ok/err). Espelha `contract-list.query.ts`. Lista REAL paginada da Fatia 2.
 */
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { ListDocumentsInput } from '#modules/financial/client/data/model/document.model.ts'

export const contasAPagarQueryKey = (input: ListDocumentsInput) =>
  ['financial', 'documents', 'list', input] as const

export const contasAPagarQueryOptions = (input: ListDocumentsInput) => ({
  queryKey: contasAPagarQueryKey(input),
  queryFn: () => financialRepository.list(input),
  staleTime: 30_000, // evita refetch agressivo na navegação da lista
})
