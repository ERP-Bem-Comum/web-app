/**
 * Binding do detalhe — ADAPTER React. `useQuery` (detalhe) + `useMutation` (status) + RBAC.
 * Sem `canViewSensitive` (financiador não tem campos sensíveis).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { StatusAction } from '#modules/partners/client/domain/financier.types.ts'

import { deriveDetailState, financierDetailViewModel, type FinancierDetailState } from './financier-detail.view-model.ts'
import { financierStatusMutationOptions } from './financier-status.mutation.ts'

export type FinancierStatusCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (id: string, action: StatusAction) => void
}>

export type FinancierDetailBinding = Readonly<{
  state: FinancierDetailState
  statusCommand: FinancierStatusCommand
  canWrite: boolean
}>

export function useFinancierDetailBinding(id: string): FinancierDetailBinding {
  const queryClient = useQueryClient()
  const query = useQuery(financierDetailViewModel.query(id))
  const mutation = useMutation({
    ...financierStatusMutationOptions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['financiers'] })
    },
  })
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)

  const state: FinancierDetailState = ((): FinancierDetailState => {
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
      execute: (fid, action) => {
        mutation.mutate({ id: fid, action })
      },
    },
    canWrite: can(granted, 'financier:write'),
  }
}
