import { contractsRepository } from '#modules/contracts/client/data/repository/contracts.repository.instance.ts'

export const contractDetailQueryKey = (id: string) => ['contracts', 'detail', id] as const

export const contractDetailQueryOptions = (id: string) => ({
  queryKey: contractDetailQueryKey(id),
  queryFn: () => contractsRepository.getById(id),
})
