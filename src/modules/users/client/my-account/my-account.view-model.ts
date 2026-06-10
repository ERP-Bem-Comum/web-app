/**
 * ViewModel do "Minha Conta" — AGNÓSTICO (puro). Deriva o estado do Result.
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { usersErrorTag } from '#modules/users/client/data/helpers/users-error-tag.ts'
import type { UsersError } from '#modules/users/client/data/repository/users-error.ts'
import type { UserDetail } from '#modules/users/client/data/model/user.model.ts'

import { myAccountQueryOptions } from './my-account.query.ts'

export type MyAccountState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; me: UserDetail }>

export function deriveMyAccountState(result: Result<UserDetail, UsersError>): MyAccountState {
  return isOk(result)
    ? { status: 'ready', me: result.value }
    : { status: 'error', errorTag: usersErrorTag(result.error) }
}

/** Iniciais para o avatar (até 2 letras a partir do nome; '?' quando vazio). */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

export const myAccountViewModel = {
  query: myAccountQueryOptions,
}

// Re-export para as views (§XI: page/component não importam client/data direto — pegam tipos por aqui).
export type { UserDetail, UpdateMeInput, ChangePasswordInput } from '#modules/users/client/data/model/user.model.ts'
