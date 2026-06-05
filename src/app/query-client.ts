/**
 * createAppQueryClient — QueryClient da app com a política de erro central (composition root).
 * - queryCache.onError: QueryError(auth:expired) → clear() + onAuthExpired (signOut/redirect).
 * - mutationCache.onSuccess: invalida queries (re-sincroniza após mutation).
 * `onAuthExpired` é injetado pelo router (que faz o navigate). Constituição §V (cadeia de erro).
 */
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { isQueryError } from '#shared/http/query-error.ts'

export const createAppQueryClient = (onAuthExpired: () => void): QueryClient => {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isQueryError(error) && error.appError.kind === 'auth:expired') {
          queryClient.clear()
          onAuthExpired()
        }
      },
    }),
    mutationCache: new MutationCache({
      onSuccess: () => {
        void queryClient.invalidateQueries()
      },
    }),
  })

  return queryClient
}
