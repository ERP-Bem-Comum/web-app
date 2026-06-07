/**
 * Binding da listagem de ACTs — ADAPTER React (§XI). `useQuery` + RBAC (collaborator:write → canCreate).
 */
import { useQuery } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { ActListFilters } from '#modules/partners/client/domain/act.schemas.ts'

import { mapResponseToRows, actListViewModel, type ActListState } from './act-list.view-model.ts'

export type ActListBinding = Readonly<{
  state: ActListState
  canCreate: boolean
}>

export function useActListBinding(filters: ActListFilters): ActListBinding {
  const query = useQuery(actListViewModel.query(filters))
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
