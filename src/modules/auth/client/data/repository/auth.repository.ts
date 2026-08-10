/**
 * auth.repository — a PORTA do client para o BFF (qual server fn consumir). Injeta `loginFn` (a server
 * function) → testável e trocável. Converte o resultado RPC (LoginFnResult) em `Result` do client.
 * NÃO contém regra de negócio (o domínio é server-side); só adapta o contrato.
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { LoginFnResult } from '#modules/auth/server/adapters/server-fns/login.server-fn.ts'
import type { RequestPasswordResetFnResult } from '#modules/auth/server/adapters/server-fns/request-password-reset.server-fn.ts'
import type { ResetPasswordFnResult } from '#modules/auth/server/adapters/server-fns/reset-password.server-fn.ts'
import type {
  LoginInput,
  AuthenticatedUser,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '#modules/auth/client/data/model/auth.model.ts'

/**
 * Erro de auth propagado pelo BFF (derivado do contrato das server fns — sem importar server/domain).
 * Une os erros de TODAS as fns de auth: reset-password acrescenta 'reset-token-invalid' (#038), que não
 * aparece no login. Manter a união aqui deixa o `authErrorTag` exaustivo cobrir todos os slugs.
 */
export type AuthError = Extract<LoginFnResult, { ok: false }>['error']

type LoginFn = (opts: Readonly<{ data: LoginInput }>) => Promise<LoginFnResult>
type RequestPasswordResetFn = (
  opts: Readonly<{ data: ForgotPasswordInput }>,
) => Promise<RequestPasswordResetFnResult>
type ResetPasswordFn = (opts: Readonly<{ data: ResetPasswordInput }>) => Promise<ResetPasswordFnResult>

/** Falha de login para a UI: o código do erro + um `reference` id (correlação) quando houver (D8/ADR-0019). */
export type LoginFailure = Readonly<{ code: AuthError; reference?: string }>

export type AuthRepository = Readonly<{
  login: (input: LoginInput) => Promise<Result<AuthenticatedUser, LoginFailure>>
  /**
   * "Esqueci Minha Senha" (#037). Anti-enumeração: em 202 devolve `ok(undefined)` SEMPRE — nunca
   * revela se o e-mail existe. Só falha de transporte/servidor vira `err(AuthFailure)`.
   */
  requestPasswordReset: (input: ForgotPasswordInput) => Promise<Result<void, LoginFailure>>
  /**
   * "Redefinir Senha" (#038). Sucesso (2xx) → `ok(undefined)`. Falha vira `err(LoginFailure)`:
   * 'reset-token-invalid' (400, link inválido/expirado/usado) ou transporte/servidor (rede/5xx).
   */
  resetPassword: (input: ResetPasswordInput) => Promise<Result<void, LoginFailure>>
}>

export const createAuthRepository = (
  deps: Readonly<{
    loginFn: LoginFn
    requestPasswordResetFn: RequestPasswordResetFn
    resetPasswordFn: ResetPasswordFn
  }>,
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
  resetPassword: async (input) => {
    const res = await deps.resetPasswordFn({ data: input })
    return res.ok ? ok(undefined) : err({ code: res.error, reference: res.reference })
  },
})
