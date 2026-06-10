/**
 * Binding da listagem de Usuários — ADAPTER React (§XI). `useQuery` + RBAC (user:create → canCreate).
 */
import { useQuery } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { can, grantedPermissions } from '#modules/users/client/data/helpers/can.ts'
import { usersErrorTag } from '#modules/users/client/data/helpers/users-error-tag.ts'
import type { UsersListFilters } from '#modules/users/client/data/users-list-filters.schema.ts'

import { mapResponseToRows, usersListViewModel, type UsersListState } from './users-list.view-model.ts'

export type UsersListBinding = Readonly<{
  state: UsersListState
  canCreate: boolean
}>

export function useUsersListBinding(filters: UsersListFilters): UsersListBinding {
  const query = useQuery(usersListViewModel.query(filters))
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)
  const canCreate = can(granted, 'user:create')

  if (query.isPending) return { state: { status: 'loading' }, canCreate }

  const res = query.data
  if (query.isError || res === undefined) {
    return { state: { status: 'error', errorTag: 'users.error.server' }, canCreate }
  }
  if (!res.ok) {
    return { state: { status: 'error', errorTag: usersErrorTag(res.error) }, canCreate }
  }
  return {
    state: { status: 'ready', rows: mapResponseToRows(res.value), meta: res.value.meta },
    canCreate,
  }
}
