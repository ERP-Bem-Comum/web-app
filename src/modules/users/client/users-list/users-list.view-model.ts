/**
 * ViewModel da listagem de Usuários — AGNÓSTICO (objeto puro, zero React). Derivações: model → row.
 */
import type { UserListItem, UserListResponse } from '#modules/users/client/data/model/user.model.ts'
import type { UserRow } from '#modules/users/client/domain/user.types.ts'

import { usersListQueryOptions } from './users-list.query.ts'

export type UsersListState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; rows: readonly UserRow[]; meta: UserListResponse['meta'] }>

export function mapItemToRow(item: UserListItem): UserRow {
  return { id: item.id, name: item.name, email: item.email, activation: item.activation }
}

export function mapResponseToRows(response: UserListResponse): readonly UserRow[] {
  return response.items.map(mapItemToRow)
}

export function totalPages(meta: UserListResponse['meta']): number {
  return Math.max(1, Math.ceil(meta.total / Math.max(1, meta.limit)))
}

export const usersListViewModel = {
  query: usersListQueryOptions,
}

export type { UserRow } from '#modules/users/client/domain/user.types.ts'
