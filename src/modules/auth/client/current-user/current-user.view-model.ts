/**
 * Lógica PURA do ViewModel de usuário atual — deriva { user, isAuthenticated } do dado da query.
 * Separada do hook (TanStack) p/ ser testável em node:test. R3: o usuário é mínimo ({ userId }).
 */
import type { CurrentUser } from '#modules/auth/client/data/model/auth.model.ts'

export type CurrentUserView = Readonly<{ user: CurrentUser | null; isAuthenticated: boolean }>

export const deriveCurrentUser = (data: CurrentUser | null | undefined): CurrentUserView => ({
  user: data ?? null,
  isAuthenticated: data !== null && data !== undefined,
})
