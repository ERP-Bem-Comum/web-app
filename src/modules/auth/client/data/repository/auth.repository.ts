/**
 * auth.repository — a PORTA do client para o BFF (qual server fn consumir). Injeta `loginFn` (a server
 * function) → testável e trocável. Converte o resultado RPC (LoginFnResult) em `Result` do client.
 * NÃO contém regra de negócio (o domínio é server-side); só adapta o contrato.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { LoginFnResult } from '#modules/auth/server/adapters/server-fns/login.server-fn.ts'
import type { RequestPasswordResetFnResult } from '#modules/auth/server/adapters/server-fns/request-password-reset.server-fn.ts'
import type {
  LoginInput,
  AuthenticatedUser,
  ForgotPasswordInput,
} from '#modules/auth/client/data/model/auth.model.ts'

/** Erro de auth propagado pelo BFF (derivado do contrato da server fn — sem importar server/domain). */
export type AuthError = Extract<LoginFnResult, { ok: false }>['error']

type LoginFn = (opts: Readonly<{ data: LoginInput }>) => Promise<LoginFnResult>
type RequestPasswordResetFn = (
  opts: Readonly<{ data: ForgotPasswordInput }>,
) => Promise<RequestPasswordResetFnResult>

/** Falha de login para a UI: o código do erro + um `reference` id (correlação) quando houver (D8/ADR-0019). */
export type LoginFailure = Readonly<{ code: AuthError; reference?: string }>

export type AuthRepository = Readonly<{
  login: (input: LoginInput) => Promise<Result<AuthenticatedUser, LoginFailure>>
  /**
   * "Esqueci Minha Senha" (#037). Anti-enumeração: em 202 devolve `ok(undefined)` SEMPRE — nunca
   * revela se o e-mail existe. Só falha de transporte/servidor vira `err(AuthFailure)`.
   */
  requestPasswordReset: (input: ForgotPasswordInput) => Promise<Result<void, LoginFailure>>
}>

export const createAuthRepository = (
  deps: Readonly<{ loginFn: LoginFn; requestPasswordResetFn: RequestPasswordResetFn }>,
): AuthRepository => ({
  login: async (input) => {
    const res = await deps.loginFn({ data: input })
    // O login só devolve a identidade; permissões são do /me (getCurrentUser). Sem placeholder.
    return res.ok ? ok({ userId: res.userId }) : err({ code: res.error, reference: res.reference })
  },
  requestPasswordReset: async (input) => {
    const res = await deps.requestPasswordResetFn({ data: input })
    return res.ok ? ok(undefined) : err({ code: res.error, reference: res.reference })
  },
})
