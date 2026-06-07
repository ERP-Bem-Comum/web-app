/**
 * auth.repository — a PORTA do client para o BFF (qual server fn consumir). Injeta `loginFn` (a server
 * function) → testável e trocável. Converte o resultado RPC (LoginFnResult) em `Result` do client.
 * NÃO contém regra de negócio (o domínio é server-side); só adapta o contrato.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { LoginFnResult } from '#modules/auth/server/adapters/server-fns/login.server-fn.ts'
import type { LoginInput, AuthenticatedUser } from '#modules/auth/client/data/model/auth.model.ts'

/** Erro de auth propagado pelo BFF (derivado do contrato da server fn — sem importar server/domain). */
export type AuthError = Extract<LoginFnResult, { ok: false }>['error']

type LoginFn = (opts: Readonly<{ data: LoginInput }>) => Promise<LoginFnResult>

export type AuthRepository = Readonly<{
  login: (input: LoginInput) => Promise<Result<AuthenticatedUser, AuthError>>
}>

export const createAuthRepository = (deps: Readonly<{ loginFn: LoginFn }>): AuthRepository => ({
  login: async (input) => {
    const res = await deps.loginFn({ data: input })
    // O login só devolve a identidade; permissões são do /me (getCurrentUser). Sem placeholder.
    return res.ok ? ok({ userId: res.userId }) : err(res.error)
  },
})
