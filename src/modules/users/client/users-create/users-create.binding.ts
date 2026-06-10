/**
 * Binding da criação de Usuário — ADAPTER React. `useMutation` → Command. Invalida a lista e navega à
 * listagem no sucesso. RBAC: user:create. Espelha `act-create.binding.ts`.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/users/client/data/helpers/can.ts'
import type { CreateUserInput } from '#modules/users/client/data/model/user.model.ts'

import { usersCreateViewModel } from './users-create.view-model.ts'

export type UsersCreateCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (input: CreateUserInput) => void
}>

export type UsersCreateBinding = Readonly<{
  createCommand: UsersCreateCommand
  canCreate: boolean
}>

export function useUsersCreateBinding(): UsersCreateBinding {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)
  const mutation = useMutation({
    ...usersCreateViewModel.mutation,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      if (isOk(res)) void navigate({ to: '/usuarios' })
    },
  })

  const data = mutation.data
  const errorTag = mutation.isPending
    ? null
    : data !== undefined && !isOk(data)
      ? usersCreateViewModel.toErrorTag(data.error)
      : mutation.isError
        ? usersCreateViewModel.unexpectedErrorTag
        : null

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      execute: (input) => {
        mutation.mutate(input)
      },
    },
    canCreate: can(granted, 'user:create'),
  }
}
