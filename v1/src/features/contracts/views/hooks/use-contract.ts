import { useSuspenseQuery } from '@tanstack/react-query'
import { getContract } from '@/features/contracts/infrastructure/get-contract.server-fn'
import { contractKeys } from '../../adapters/queries'

export function useContract(id: string) {
  return useSuspenseQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => getContract({ data: { id } }),
  })
}
