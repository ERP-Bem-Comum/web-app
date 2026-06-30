/**
 * Binding da edição de ACT — ADAPTER React. `useQuery` (pré-preenche via detail) + `useMutation`
 * (update) + RBAC. Navega de volta ao detalhe no `onSuccess`. canWrite = collaborator:write.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { ActFormValues } from '#modules/partners/client/data/model/act.model.ts'
import { actDetailQueryOptions } from '#modules/partners/client/act-detail/act-detail.query.ts'

import { actUpdateMutationOptions } from './act-edit.mutation.ts'
import { deriveEditState, type ActEditState } from './act-edit.view-model.ts'

export type ActUpdateCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (values: ActFormValues) => void
}>

export type ActEditBinding = Readonly<{
  state: ActEditState
  updateCommand: ActUpdateCommand
  canWrite: boolean
}>

export function useActEditBinding(id: string): ActEditBinding {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const query = useQuery(actDetailQueryOptions(id))
  const mutation = useMutation({
    ...actUpdateMutationOptions,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['acts'] })
      if (isOk(res)) void navigate({ to: '/parceiros/atos/$id', params: { id } })
    },
  })
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)

  const state: ActEditState = ((): ActEditState => {
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
    canWrite: can(granted, 'collaborator:write'),
  }
}
