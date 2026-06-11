/**
 * Binding do detalhe de Usuário — ADAPTER React. `useQuery` (detalhe) + mutations (edição inline +
 * ativação) + RBAC. Edição inline na própria tela (padrão do detalhe do ACT). Espelha
 * `act-detail.binding.ts`. canUpdate = user:update.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/users/client/data/helpers/can.ts'
import { usersErrorTag } from '#modules/users/client/data/helpers/users-error-tag.ts'
import type { UpdateUserInput } from '#modules/users/client/data/model/user.model.ts'
import type { StatusAction } from '#modules/users/client/domain/user.types.ts'

import { deriveUserDetailState, userDetailViewModel, type UserDetailState } from './users-detail.view-model.ts'
import { usersUpdateMutationOptions } from './users-update.mutation.ts'
import { usersStatusMutationOptions } from './users-status.mutation.ts'

export type UsersStatusCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (id: string, action: StatusAction) => void
}>

export type UsersSaveCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (values: UpdateUserInput) => void
}>

export type UsersDetailBinding = Readonly<{
  state: UserDetailState
  saveCommand: UsersSaveCommand
  statusCommand: UsersStatusCommand
  canUpdate: boolean
  canSetStatus: boolean
}>

export function useUsersDetailBinding(id: string, onSaved?: () => void): UsersDetailBinding {
  const queryClient = useQueryClient()
  const query = useQuery(userDetailViewModel.query(id))
  const saveMutation = useMutation({
    ...usersUpdateMutationOptions,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      if (isOk(res)) onSaved?.()
    },
  })
  const statusMutation = useMutation({
    ...usersStatusMutationOptions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)

  const state: UserDetailState = ((): UserDetailState => {
    if (query.isPending) return { status: 'loading' }
    const res = query.data
    if (query.isError || res === undefined) return { status: 'error', errorTag: 'users.error.server' }
    return deriveUserDetailState(res)
  })()

  const sdata = saveMutation.data
  const saveErrorTag = saveMutation.isPending
    ? null
    : sdata !== undefined && !isOk(sdata)
      ? usersErrorTag(sdata.error)
      : saveMutation.isError
        ? 'users.error.server'
        : null

  const stdata = statusMutation.data
  const statusErrorTag = statusMutation.isPending
    ? null
    : stdata !== undefined && !isOk(stdata)
      ? usersErrorTag(stdata.error)
      : statusMutation.isError
        ? 'users.error.server'
        : null

  return {
    state,
    saveCommand: {
      running: saveMutation.isPending,
      errorTag: saveErrorTag,
      execute: (values) => {
        saveMutation.mutate({ ...values, id })
      },
    },
    statusCommand: {
      running: statusMutation.isPending,
      errorTag: statusErrorTag,
      execute: (uid, action) => {
        statusMutation.mutate({ id: uid, action })
      },
    },
    canUpdate: can(granted, 'user:update'),
    canSetStatus: can(granted, 'user:activate') || can(granted, 'user:deactivate'),
  }
}
