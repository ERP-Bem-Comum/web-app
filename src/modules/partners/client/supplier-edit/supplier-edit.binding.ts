/**
 * Binding da edição — ADAPTER React. `useQuery` (pré-preenche) + `useMutation` (update) + RBAC.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, type PartnerPermission } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { SupplierDetail, SupplierFormValues } from '#modules/partners/client/data/model/supplier.model.ts'
import { supplierDetailQueryOptions } from '#modules/partners/client/supplier-detail/supplier-detail.query.ts'
import { serviceCategoriesQueryOptions } from '#modules/partners/client/supplier-list/supplier-list.query.ts'

import { supplierUpdateMutationOptions } from './supplier-edit.mutation.ts'
import { deriveEditState, type SupplierEditState } from './supplier-edit.view-model.ts'

export type SupplierUpdateCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: SupplierDetail | null
  execute: (values: SupplierFormValues) => void
}>

export type SupplierEditBinding = Readonly<{
  state: SupplierEditState
  updateCommand: SupplierUpdateCommand
  canEditSensitive: boolean
  categories: readonly string[]
}>

export function useSupplierEditBinding(id: string): SupplierEditBinding {
  const queryClient = useQueryClient()
  const query = useQuery(supplierDetailQueryOptions(id))
  const categoriesQuery = useQuery(serviceCategoriesQueryOptions())
  const mutation = useMutation({
    ...supplierUpdateMutationOptions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
  const current = useCurrentUser()
  const granted = (current.user?.permissions ?? []) as readonly PartnerPermission[]

  const state: SupplierEditState = ((): SupplierEditState => {
    if (query.isPending) return { status: 'loading' }
    const res = query.data
    if (query.isError || res === undefined) {
      return { status: 'error', errorTag: 'partners.error.server' }
    }
    return deriveEditState(res)
  })()

  const mdata = mutation.data
  const errorTag =
    mdata !== undefined && !isOk(mdata)
      ? partnersErrorTag(mdata.error)
      : mutation.isError
        ? 'partners.error.server'
        : null

  return {
    state,
    updateCommand: {
      running: mutation.isPending,
      errorTag,
      result: mdata !== undefined && isOk(mdata) ? mdata.value : null,
      execute: (values) => {
        mutation.mutate({ ...values, id })
      },
    },
    canEditSensitive: can(granted, 'supplier:edit-sensitive'),
    categories: categoriesQuery.data?.ok ? categoriesQuery.data.value : [],
  }
}
