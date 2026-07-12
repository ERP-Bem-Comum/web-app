/**
 * Gateway client de "encerrar todas as sessões" — porta que chama a server fn `revokeAllSessionsFn`
 * (RPC). client/data é a única camada client que toca server/adapters. Devolve void (o resultado não
 * interessa à UI: o efeito é o logout do dispositivo atual, tratado pelo evento no use-case).
 */
import { revokeAllSessionsFn } from '#modules/auth/server/adapters/server-fns/revoke-all-sessions.server-fn.ts'

export const requestRevokeAllSessions = async (): Promise<void> => {
  await revokeAllSessionsFn()
  return
}
