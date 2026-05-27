import { useSuspenseQuery } from '@tanstack/react-query'
import { getContractById } from '@/server/contracts.server'
import { contractKeys } from '../../adapters/queries'

export function useContract(id: number) {
  return useSuspenseQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => getContractById({ data: { id } }),
  })
}
