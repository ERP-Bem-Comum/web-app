/**
 * Binding da listagem — ADAPTER React (§XI). Liga o view-model ao TanStack Query + RBAC.
 * Entrega estado CRU (sem i18n) + `canCreate`; a page traduz `errorTag`.
 */
import { useQuery } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { SupplierListFilters } from '#modules/partners/client/data/supplier-list-filters.schema.ts'

import { serviceCategoriesQueryOptions } from './supplier-list.query.ts'
import {
  mapResponseToRows,
  supplierListViewModel,
  type SupplierListState,
} from './supplier-list.view-model.ts'

export type SupplierListBinding = Readonly<{
  state: SupplierListState
  canCreate: boolean
  categories: readonly string[]
}>

export function useSupplierListBinding(filters: SupplierListFilters): SupplierListBinding {
  const query = useQuery(supplierListViewModel.query(filters))
  const categoriesQuery = useQuery(serviceCategoriesQueryOptions())
  const categories = categoriesQuery.data?.ok ? categoriesQuery.data.value : []
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)
  const canCreate = can(granted, 'supplier:write')

  if (query.isPending) return { state: { status: 'loading' }, canCreate, categories }

  const res = query.data
  if (query.isError || res === undefined) {
    return { state: { status: 'error', errorTag: 'partners.error.server' }, canCreate, categories }
  }
  if (!res.ok) {
    return { state: { status: 'error', errorTag: partnersErrorTag(res.error) }, canCreate, categories }
  }
  return {
    state: { status: 'ready', rows: mapResponseToRows(res.value), meta: res.value.meta },
    canCreate,
    categories,
  }
}
