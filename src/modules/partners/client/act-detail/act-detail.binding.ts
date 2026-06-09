/**
 * Binding do detalhe de ACT — ADAPTER React. `useQuery` (detalhe) + mutations (ativação + update inline)
 * + RBAC. Edição inline na própria tela (padrão do detalhe de Colaboradores). canWrite = collaborator:write.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { StatusAction } from '#modules/partners/client/domain/act.types.ts'
import type { ActFormValues } from '#modules/partners/client/data/model/act.model.ts'
import { actUpdateMutationOptions } from '#modules/partners/client/act-edit/act-edit.mutation.ts'

import { deriveDetailState, actDetailViewModel, type ActDetailState } from './act-detail.view-model.ts'
import { actStatusMutationOptions } from './act-status.mutation.ts'

export type ActStatusCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (id: string, action: StatusAction) => void
}>

export type ActSaveCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (values: ActFormValues) => void
}>

export type ActDetailBinding = Readonly<{
  state: ActDetailState
  statusCommand: ActStatusCommand
  saveCommand: ActSaveCommand
  canWrite: boolean
}>

export function useActDetailBinding(id: string, onSaved?: () => void): ActDetailBinding {
  const queryClient = useQueryClient()
  const query = useQuery(actDetailViewModel.query(id))
  const mutation = useMutation({
    ...actStatusMutationOptions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['acts'] })
    },
  })
  const saveMutation = useMutation({
    ...actUpdateMutationOptions,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['acts'] })
      if (isOk(res)) onSaved?.()
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
      execute: (aid, action) => {
        mutation.mutate({ id: aid, action })
      },
    },
    saveCommand: {
      running: saveMutation.isPending,
      errorTag: saveErrorTag,
      execute: (values) => {
        saveMutation.mutate({ ...values, id })
      },
    },
    canWrite: can(granted, 'collaborator:write'),
  }
}
