/**
 * createAppQueryClient — QueryClient da app com a política de erro central (composition root).
 * - queryCache.onError: QueryError(auth:expired) → clear() + onAuthExpired (signOut/redirect).
 * `onAuthExpired` é injetado pelo router (que faz o navigate). Constituição §V (cadeia de erro).
 *
 * A invalidação de cache pós-mutation é ESCOPADA por binding (cada binding invalida só as keys
 * que tocou, em onSuccess/isOk) — não há invalidação global aqui (antes, invalidar sem argumento
 * re-buscava o app inteiro a cada mutation; ver A5 do code-review).
 */
import { QueryCache, QueryClient } from '@tanstack/react-query'

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
  })

  return queryClient
}
