/**
 * Binding do detalhe — ADAPTER React. `useQuery` (detalhe) + mutations (status + update inline) + RBAC.
 * Edição inline na própria tela (padrão do detalhe de Colaboradores): `saveCommand` persiste via update.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { StatusAction } from '#modules/partners/client/domain/supplier.types.ts'
import type { SupplierFormValues } from '#modules/partners/client/data/model/supplier.model.ts'
import { serviceCategoriesQueryOptions } from '#modules/partners/client/supplier-list/supplier-list.query.ts'
import { supplierUpdateMutationOptions } from '#modules/partners/client/supplier-edit/supplier-edit.mutation.ts'

import { deriveDetailState, supplierDetailViewModel, type SupplierDetailState } from './supplier-detail.view-model.ts'
import { supplierStatusMutationOptions } from './supplier-status.mutation.ts'

export type SupplierStatusCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (id: string, action: StatusAction) => void
}>

export type SupplierSaveCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (values: SupplierFormValues) => void
}>

export type SupplierDetailBinding = Readonly<{
  state: SupplierDetailState
  statusCommand: SupplierStatusCommand
  saveCommand: SupplierSaveCommand
  canWrite: boolean
  canViewSensitive: boolean
  categories: readonly string[]
}>

export function useSupplierDetailBinding(id: string, onSaved?: () => void): SupplierDetailBinding {
  const queryClient = useQueryClient()
  const query = useQuery(supplierDetailViewModel.query(id))
  const categoriesQuery = useQuery(serviceCategoriesQueryOptions())
  const mutation = useMutation({
    ...supplierStatusMutationOptions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
  const saveMutation = useMutation({
    ...supplierUpdateMutationOptions,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      if (isOk(res)) onSaved?.()
    },
  })
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)

  const state: SupplierDetailState = ((): SupplierDetailState => {
    if (query.isPending) return { status: 'loading' }
    const res = query.data
    if (query.isError || res === undefined) {
      return { status: 'error', errorTag: 'partners.error.server' }
    }
    return deriveDetailState(res)
  })()

  const mdata = mutation.data
  const statusErrorTag = mutation.isPending
    ? null
    : mdata !== undefined && !isOk(mdata)
      ? partnersErrorTag(mdata.error)
      : mutation.isError
        ? 'partners.error.server'
        : null

  const sdata = saveMutation.data
  const saveErrorTag = saveMutation.isPending
    ? null
    : sdata !== undefined && !isOk(sdata)
      ? partnersErrorTag(sdata.error)
      : saveMutation.isError
        ? 'partners.error.server'
        : null

  return {
    state,
    statusCommand: {
      running: mutation.isPending,
      errorTag: statusErrorTag,
      execute: (sid, action) => {
        mutation.mutate({ id: sid, action })
      },
    },
    saveCommand: {
      running: saveMutation.isPending,
      errorTag: saveErrorTag,
      execute: (values) => {
        saveMutation.mutate({ ...values, id })
      },
    },
    canWrite: can(granted, 'supplier:write'),
    canViewSensitive: can(granted, 'supplier:edit-sensitive'),
    categories: categoriesQuery.data?.ok ? categoriesQuery.data.value : [],
  }
}
