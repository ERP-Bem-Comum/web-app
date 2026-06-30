/**
 * contractListQueryOptions — data AGNÓSTICA do comportamento listagem.
 */
import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'
import type { ListContractsInput } from '#modules/contracts/client/data/model/contracts.model.ts'

export const contractListQueryKey = (input: ListContractsInput) => ['contracts', 'list', input] as const

export const contractListQueryOptions = (input: ListContractsInput) => ({
  queryKey: contractListQueryKey(input),
  queryFn: () => contractsRepository.list(input),
  // Evita refetch agressivo (foco/montagem) durante a navegação da lista — M1.
  staleTime: 30_000,
})
