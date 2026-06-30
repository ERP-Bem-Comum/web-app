/**
 * Gateway client p/ o usuário atual — a porta que chama a server fn `getCurrentUserFn` (RPC).
 * Fica em client/data (única camada client que toca server/adapters). Devolve { userId } | null.
 */
import { getCurrentUserFn } from '#modules/auth/server/adapters/server-fns/get-current-user.server-fn.ts'
import type { CurrentUser } from '#modules/auth/client/data/model/auth.model.ts'

export const fetchCurrentUser = (): Promise<CurrentUser | null> => getCurrentUserFn()
