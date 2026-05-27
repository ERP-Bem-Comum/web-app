import { useSuspenseQuery } from '@tanstack/react-query'
import { getContracts } from '@/server/contracts.server'
import { contractKeys } from '../../adapters/queries'
import type { ContractListFilters } from '../../domain/schemas'

export function useContracts(filters: ContractListFilters) {
  return useSuspenseQuery({
    queryKey: contractKeys.list(filters),
    queryFn: () => getContracts({ data: filters }),
  })
}
