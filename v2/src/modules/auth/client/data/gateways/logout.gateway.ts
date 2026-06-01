/**
 * Gateway client de logout — porta que chama a server fn `logoutFn` (RPC). client/data é a única
 * camada client que toca server/adapters. Devolve void (o resultado do logout não interessa à UI).
 */
import { logoutFn } from '#modules/auth/server/adapters/server-fns/logout.server-fn.ts'

export const requestLogout = async (): Promise<void> => {
  await logoutFn()
  return
}
