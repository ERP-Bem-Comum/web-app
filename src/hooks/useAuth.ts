import { useQuery } from '@tanstack/react-query'
import { getSession } from '@/server/auth'

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => getSession(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  return {
    session: data ?? null,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
  }
}
