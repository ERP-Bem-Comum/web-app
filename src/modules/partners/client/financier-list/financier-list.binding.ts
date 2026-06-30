/**
 * Binding da listagem — ADAPTER React (§XI). Liga o view-model ao TanStack Query + RBAC.
 * Entrega estado CRU (sem i18n) + `canCreate`; a page traduz `errorTag`. Espelha o supplier,
 * sem a query de categorias.
 */
import { useQuery } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { FinancierListFilters } from '#modules/partners/client/data/financier-list-filters.schema.ts'

import {
  mapResponseToRows,
  financierListViewModel,
  type FinancierListState,
} from './financier-list.view-model.ts'

export type FinancierListBinding = Readonly<{
  state: FinancierListState
  canCreate: boolean
}>

export function useFinancierListBinding(filters: FinancierListFilters): FinancierListBinding {
  const query = useQuery(financierListViewModel.query(filters))
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)
  const canCreate = can(granted, 'financier:write')

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
