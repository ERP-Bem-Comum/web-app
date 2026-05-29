import { useSuspenseQuery } from '@tanstack/react-query'
import { getContractHistory } from '@/features/contracts/infrastructure/get-contract-history.server-fn'

export function useContractHistory(id: string) {
  return useSuspenseQuery({
    queryKey: ['contracts', 'history', id],
    queryFn: () => getContractHistory({ data: { id } }),
  })
}
