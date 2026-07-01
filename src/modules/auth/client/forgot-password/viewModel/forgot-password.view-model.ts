/**
 * forgotPasswordViewModel — ViewModel AGNÓSTICO do "Esqueci Minha Senha" (objeto puro; ADR-0009).
 * Define o Command (via `mutation`) e a derivação pura de erro → tag i18n. ZERO React (lint anti-react).
 * Testável em node:test. O binding (`forgot-password.binding.ts`) o liga ao framework.
 *
 * Anti-enumeração: NÃO há efeito de sucesso que dependa da existência do e-mail — o sucesso é uniforme
 * (modal genérico), decidido pelo binding a partir de `isOk` do Result. Aqui só mapeamos ERRO → tag.
 */
import type { AuthError } from '#modules/auth/client/data/repository/auth.repository.ts'
import { authErrorTag } from '#modules/auth/client/data/helpers/auth-error-tag.ts'
import { requestPasswordResetMutationOptions } from '../bind/forgot-password.mutation.ts'

export const forgotPasswordViewModel = {
  mutation: requestPasswordResetMutationOptions,

  /** Derivação pura: erro de auth → tag de i18n (a View resolve a tag → texto). */
  toErrorTag: (error: AuthError): string => authErrorTag(error),

  /** Tag para erro INESPERADO/LANÇADO (rede, env, server, RPC) — quando não há Result.err. */
  unexpectedErrorTag: 'auth.error.unexpected',
}
