/**
 * Lógica PURA do ViewModel de login — deriva o estado da tela a partir do estado da mutation.
 * Separada do hook (que usa TanStack/router) para ser testável em node:test (sem DOM/framework).
 */
import type { Result } from '#shared/primitives/result.ts'
import type { CurrentUser } from '#modules/auth/client/data/model/auth.model.ts'
import type { AuthError } from '#modules/auth/client/data/repository/auth.repository.ts'
import { authErrorTag } from '#modules/auth/client/data/helpers/auth-error-tag.ts'

export type LoginStatus = 'idle' | 'submitting' | 'error'

export type LoginView = Readonly<{ status: LoginStatus; errorTag: string | null }>

export const deriveLoginView = (
  state: Readonly<{ isPending: boolean; data?: Result<CurrentUser, AuthError> }>,
): LoginView => {
  if (state.isPending) return { status: 'submitting', errorTag: null }
  if (state.data !== undefined && !state.data.ok) {
    return { status: 'error', errorTag: authErrorTag(state.data.error) }
  }
  return { status: 'idle', errorTag: null }
}
