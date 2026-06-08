/**
 * Binding da listagem de Colaboradores — ADAPTER React (§XI). `useQuery` + RBAC (collaborator:write
 * → canCreate). Espelha `act-list.binding.ts`.
 */
import { useQuery } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { CollaboratorListFilters } from '#modules/partners/client/data/collaborator-list-filters.schema.ts'

import {
  mapResponseToRows,
  collaboratorListViewModel,
  type CollaboratorListState,
} from './collaborator-list.view-model.ts'

export type CollaboratorListBinding = Readonly<{
  state: CollaboratorListState
  canCreate: boolean
}>

export function useCollaboratorListBinding(filters: CollaboratorListFilters): CollaboratorListBinding {
  const query = useQuery(collaboratorListViewModel.query(filters))
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)
  const canCreate = can(granted, 'collaborator:write')

  if (query.isPending) return { state: { status: 'loading' }, canCreate }

  const res = query.data
  if (query.isError || res === undefined) {
    return { state: { status: 'error', errorTag: 'partners.error.server' }, canCreate }
  }
  if (!res.ok) {
    return { state: { status: 'error', errorTag: partnersErrorTag(res.error) }, canCreate }
  }
  return {
    state: { status: 'ready', rows: mapResponseToRows(res.value), meta: res.value.meta },
    canCreate,
  }
}
