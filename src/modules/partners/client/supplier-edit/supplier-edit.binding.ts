/**
 * Binding da edição — ADAPTER React. `useQuery` (pré-preenche) + `useMutation` (update) + RBAC.
 * Navega de volta ao detalhe no `onSuccess` (não num `useEffect` que observa `result`).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { SupplierFormValues } from '#modules/partners/client/data/model/supplier.model.ts'
import { supplierDetailQueryOptions } from '#modules/partners/client/supplier-detail/supplier-detail.query.ts'
import { serviceCategoriesQueryOptions } from '#modules/partners/client/supplier-list/supplier-list.query.ts'

import { supplierUpdateMutationOptions } from './supplier-edit.mutation.ts'
import { deriveEditState, type SupplierEditState } from './supplier-edit.view-model.ts'

export type SupplierUpdateCommand = Readonly<{
  running: boolean
  errorTag: string | null
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
  const navigate = useNavigate()
  const query = useQuery(supplierDetailQueryOptions(id))
  const categoriesQuery = useQuery(serviceCategoriesQueryOptions())
  const mutation = useMutation({
    ...supplierUpdateMutationOptions,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      if (isOk(res)) void navigate({ to: '/parceiros/fornecedores/$id', params: { id } })
    },
  })
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)

  const state: SupplierEditState = ((): SupplierEditState => {
    if (query.isPending) return { status: 'loading' }
    const res = query.data
    if (query.isError || res === undefined) {
      return { status: 'error', errorTag: 'partners.error.server' }
    }
    return deriveEditState(res)
  })()

  const mdata = mutation.data
  const errorTag = mutation.isPending
    ? null
    : mdata !== undefined && !isOk(mdata)
      ? partnersErrorTag(mdata.error)
      : mutation.isError
        ? 'partners.error.server'
        : null

  return {
    state,
    updateCommand: {
      running: mutation.isPending,
      errorTag,
      execute: (values) => {
        mutation.mutate({ ...values, id })
      },
    },
    canEditSensitive: can(granted, 'supplier:edit-sensitive'),
    categories: categoriesQuery.data?.ok ? categoriesQuery.data.value : [],
  }
}
