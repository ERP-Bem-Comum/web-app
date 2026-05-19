import { Options } from '@/types/global'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

const useLazyQuery = (key: string, queryFn: () => Promise<Options[] | undefined>) => {
  const queryInstance = useQuery({
    queryKey: [key],
    queryFn,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: true,
  })

  const { data, refetch } = queryInstance

  const getData = useCallback(() => {
    if (!data) {
      refetch()
    }
    return data
  }, [refetch, data])

  return { getData, queryInstance }
}

export default useLazyQuery
