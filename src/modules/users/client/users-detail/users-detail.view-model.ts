/**
 * ViewModel do detalhe de Usuário — AGNÓSTICO (puro). Deriva o estado do Result + mapeia o detalhe
 * para os valores iniciais do form (4 campos editáveis) + decide a ação de ativação.
 */
import { isOk, type Result } from '#shared/primitives/result.ts'
import { usersErrorTag } from '#modules/users/client/data/helpers/users-error-tag.ts'
import type { UsersError } from '#modules/users/client/data/repository/users-error.ts'
import type { UserDetail, UserFormValues } from '#modules/users/client/data/model/user.model.ts'
import type { StatusAction } from '#modules/users/client/domain/user.types.ts'

import { userDetailQueryOptions } from './users-detail.query.ts'

export type UserDetailState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; user: UserDetail }>

export function deriveUserDetailState(result: Result<UserDetail, UsersError>): UserDetailState {
  return isOk(result)
    ? { status: 'ready', user: result.value }
    : { status: 'error', errorTag: usersErrorTag(result.error) }
}

/** Pré-preenche o form com os campos editáveis do detalhe. */
export function detailToFormValues(u: UserDetail): UserFormValues {
  return { name: u.name, cpf: u.cpf, email: u.email, telephone: u.telephone }
}

/** Ação disponível conforme a ativação: ativo → desativar; inativo → reativar. */
export function statusActionFor(active: boolean): StatusAction {
  return active ? 'deactivate' : 'reactivate'
}

export const userDetailViewModel = {
  query: userDetailQueryOptions,
}

export type { UserDetail } from '#modules/users/client/data/model/user.model.ts'
