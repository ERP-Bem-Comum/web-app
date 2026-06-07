/**
 * Binding do detalhe de ACT — ADAPTER React. `useQuery` (detalhe) + `useMutation` (ativação) + RBAC.
 * canWrite = collaborator:write.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { StatusAction } from '#modules/partners/client/domain/act.types.ts'

import { deriveDetailState, actDetailViewModel, type ActDetailState } from './act-detail.view-model.ts'
import { actStatusMutationOptions } from './act-status.mutation.ts'

export type ActStatusCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (id: string, action: StatusAction) => void
}>

export type ActDetailBinding = Readonly<{
  state: ActDetailState
  statusCommand: ActStatusCommand
  canWrite: boolean
}>

export function useActDetailBinding(id: string): ActDetailBinding {
  const queryClient = useQueryClient()
  const query = useQuery(actDetailViewModel.query(id))
  const mutation = useMutation({
    ...actStatusMutationOptions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['acts'] })
    },
  })
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)

  const state: ActDetailState = ((): ActDetailState => {
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
      execute: (aid, action) => {
        mutation.mutate({ id: aid, action })
      },
    },
    canWrite: can(granted, 'collaborator:write'),
  }
}
