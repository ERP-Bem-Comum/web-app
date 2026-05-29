import { useSuspenseQuery } from '@tanstack/react-query'
import { listContracts } from '@/features/contracts/infrastructure/list-contracts.server-fn'
import { contractKeys } from '../../adapters/queries'
import type { ContractListFilters } from '../../domain/schemas'

export function useContracts(filters: ContractListFilters) {
  return useSuspenseQuery({
    queryKey: contractKeys.list(filters),
    queryFn: () => listContracts({ data: filters }),
  })
}
