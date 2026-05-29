import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMe } from '@/features/auth/infrastructure/me.server-fn'
import { logout as logoutFn } from '@/features/auth/infrastructure/logout.server-fn'

export function useAuth() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => getMe({ data: undefined }),
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
