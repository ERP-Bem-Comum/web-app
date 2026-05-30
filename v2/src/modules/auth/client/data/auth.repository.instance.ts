/**
 * Instância da repository client — wira a server function real (`loginFn`, o stub RPC client-safe que o
 * TanStack Start gera). Fica em client/data porque é a ÚNICA camada client que toca server/adapters
 * (boundary). O token nunca vem ao client (a server fn devolve só { ok, userId } | { ok:false, error }).
 */
import { loginFn } from '../../server/adapters/login.server-fn.ts'
import { createAuthRepository } from './auth.repository.ts'

export const authRepository = createAuthRepository({
  loginFn: (opts) => loginFn(opts),
})
