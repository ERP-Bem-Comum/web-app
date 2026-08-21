/**
 * contasAPagarQueryOptions — data AGNÓSTICA da listagem (queryFn devolve o `Result`; a view-model
 * ramifica em ok/err). Espelha `contract-list.query.ts`. Lista REAL paginada da Fatia 2.
 */
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type {
  ListDocumentsInput,
  ListPayableTitlesInput,
  PayableCountsInput,
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

// specs/101: conjunto COMPLETO do filtro (sem paginação de tela). A key NÃO carrega page/pageSize — o
// recorte de exibição é client-side, e incluí-los faria o cache refazer a varredura a cada troca de página.
export const allPayableTitlesQueryOptions = (
  input: Omit<ListPayableTitlesInput, 'page' | 'pageSize'>,
  enabled: boolean,
) => ({
  queryKey: ['financial', 'payable-titles', 'all', input] as const,
  queryFn: () => financialRepository.listAllPayableTitles({ ...input, page: 1, pageSize: 100 }),
  enabled,
  staleTime: 30_000,
})

// #536: contagem agregada por status (chips). Key aninhada sob `documents/list` — prefixo que TODAS as
// mutations (criar/excluir/aprovar/baixar) invalidam → os contadores atualizam junto com o grid.
export const payableCountsQueryOptions = (input: PayableCountsInput, enabled: boolean) => ({
  queryKey: ['financial', 'documents', 'list', 'counts', input] as const,
  queryFn: () => financialRepository.getPayableCounts(input),
  enabled,
  staleTime: 30_000,
})
