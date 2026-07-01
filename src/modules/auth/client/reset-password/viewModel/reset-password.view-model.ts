/**
 * resetPasswordViewModel — ViewModel AGNÓSTICO do "Redefinir Senha" (#038; objeto puro; ADR-0009).
 * Define o Command (via `mutation`) e derivações PURAS: erro → tag i18n e o gate do botão (senha atende
 * à policy E confirmação === nova). ZERO React (lint anti-react). Testável em node:test. O binding
 * (`reset-password.binding.ts`) o liga ao framework.
 */
import type { AuthError } from '#modules/auth/client/data/repository/auth.repository.ts'
import { authErrorTag } from '#modules/auth/client/data/helpers/auth-error-tag.ts'
import { passwordMeetsPolicy, type PasswordLimits } from '#modules/users/public-api/index.ts'
import { resetPasswordMutationOptions } from '../bind/reset-password.mutation.ts'

export const resetPasswordViewModel = {
  mutation: resetPasswordMutationOptions,

  /** Derivação pura: erro de auth → tag de i18n (a View resolve a tag → texto). */
  toErrorTag: (error: AuthError): string => authErrorTag(error),

  /** Tag para erro INESPERADO/LANÇADO (rede, env, server, RPC) — quando não há Result.err. */
  unexpectedErrorTag: 'auth.error.unexpected',

  /**
   * Gate PURO do botão "Redefinir senha": a nova senha atende à policy (fonte única) E a confirmação
   * bate. Não considera `running` (o binding compõe isso). Reusa a policy pura do módulo users.
   */
  canSubmit: (next: string, confirm: string, limits: PasswordLimits): boolean =>
    passwordMeetsPolicy(next, limits) && next === confirm,
}
