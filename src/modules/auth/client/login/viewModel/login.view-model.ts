/**
 * loginViewModel — ViewModel AGNÓSTICO do login (objeto puro; ADR-0009). Define o Command (via
 * `mutation`), o efeito de sucesso (`onSuccess`: emite `UsuarioAutenticado` — era o antigo
 * `client/usecase`) e a derivação pura de erro → tag i18n (`toErrorTag`). ZERO React (lint anti-react).
 * Testável em node:test. O binding (`login.binding.ts`) o liga ao framework e expõe o `loginCommand`.
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import type { AuthenticatedUser } from '#modules/auth/client/data/model/auth.model.ts'
import type { AuthError, LoginFailure } from '#modules/auth/client/data/repository/auth.repository.ts'
import type { AuthEvent } from '#modules/auth/client/data/events/auth.events.ts'
import { authErrorTag } from '#modules/auth/client/data/helpers/auth-error-tag.ts'
import { loginMutationOptions } from '../bind/login.mutation.ts'

export const loginViewModel = {
  mutation: loginMutationOptions,

  /** Efeito no sucesso: emite o fato `UsuarioAutenticado` (§XII). `emit` injetado → puro/testável. */
  onSuccess: (
    result: Result<AuthenticatedUser, LoginFailure>,
    deps: Readonly<{ emit: (event: AuthEvent) => void }>,
  ): void => {
    if (isOk(result)) deps.emit({ type: 'UsuarioAutenticado', userId: result.value.userId })
  },

  /** Derivação pura: erro de auth → tag de i18n (a View resolve a tag → texto). */
  toErrorTag: (error: AuthError): string => authErrorTag(error),

  /**
   * Tag para erro INESPERADO/LANÇADO (não é um AuthError de valor): a server fn lançou — rede, env,
   * server caído, RPC. O binding usa quando `mutation.isError` (sem `Result.err`). Evita UI silenciosa.
   */
  unexpectedErrorTag: 'auth.error.unexpected',
}
