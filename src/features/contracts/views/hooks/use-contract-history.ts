import { useSuspenseQuery } from '@tanstack/react-query'
import { getContractHistory } from '@/server/contracts'

export function useContractHistory(id: string) {
  return useSuspenseQuery({
    queryKey: ['contracts', 'history', id],
    queryFn: () => getContractHistory({ data: { id } }),
  })
}
