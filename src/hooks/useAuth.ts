import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSession, logout as logoutFn } from '@/server/auth'

export function useAuth() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => getSession({ data: undefined }),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const logoutMutation = useMutation({
    mutationFn: () => logoutFn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'session'] })
    },
  })

  return {
    user: data?.user ?? null,
    session: data ?? null,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
    logout: logoutMutation.mutateAsync,
  }
}
