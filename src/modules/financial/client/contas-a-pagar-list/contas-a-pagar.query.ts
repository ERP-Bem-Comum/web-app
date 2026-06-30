/**
 * contasAPagarQueryOptions — data AGNÓSTICA da listagem (queryFn devolve o `Result`; a view-model
 * ramifica em ok/err). Espelha `contract-list.query.ts`. Lista REAL paginada da Fatia 2.
 */
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type {
  ListDocumentsInput,
  ListPayableTitlesInput,
} from '#modules/financial/client/data/model/document.model.ts'

export const contasAPagarQueryKey = (input: ListDocumentsInput) =>
  ['financial', 'documents', 'list', input] as const

export const contasAPagarQueryOptions = (input: ListDocumentsInput, enabled = true) => ({
  queryKey: contasAPagarQueryKey(input),
  queryFn: () => financialRepository.list(input),
  enabled, // #201: grid é só por título → a listagem por documento fica desligada
  staleTime: 30_000, // evita refetch agressivo na navegação da lista
})

// #201: listagem por TÍTULO (pai + filhos). `enabled` controlado pelo binding (só no modo "título").
export const payableTitlesQueryOptions = (input: ListPayableTitlesInput, enabled: boolean) => ({
  queryKey: ['financial', 'payable-titles', 'list', input] as const,
  queryFn: () => financialRepository.listPayableTitles(input),
  enabled,
  staleTime: 30_000,
})
