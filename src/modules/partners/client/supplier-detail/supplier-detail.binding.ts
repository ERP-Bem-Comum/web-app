/**
 * Binding do detalhe — ADAPTER React. `useQuery` (detalhe) + `useMutation` (status) + RBAC.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { StatusAction } from '#modules/partners/client/domain/supplier.types.ts'

import { deriveDetailState, supplierDetailViewModel, type SupplierDetailState } from './supplier-detail.view-model.ts'
import { supplierStatusMutationOptions } from './supplier-status.mutation.ts'

export type SupplierStatusCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (id: string, action: StatusAction) => void
}>

export type SupplierDetailBinding = Readonly<{
  state: SupplierDetailState
  statusCommand: SupplierStatusCommand
  canWrite: boolean
  canViewSensitive: boolean
}>

export function useSupplierDetailBinding(id: string): SupplierDetailBinding {
  const queryClient = useQueryClient()
  const query = useQuery(supplierDetailViewModel.query(id))
  const mutation = useMutation({
    ...supplierStatusMutationOptions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] })
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

  return {
    state,
    statusCommand: {
      running: mutation.isPending,
      errorTag: statusErrorTag,
      execute: (sid, action) => {
        mutation.mutate({ id: sid, action })
      },
    },
    canWrite: can(granted, 'supplier:write'),
    canViewSensitive: can(granted, 'supplier:edit-sensitive'),
  }
}
