/**
 * Binding da criação de ACT — ADAPTER React. `useMutation` → Command. Invalida a lista e navega à
 * listagem no sucesso. RBAC: collaborator:write.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import type { ActWriteInput } from '#modules/partners/client/data/model/act.model.ts'

import { actCreateViewModel } from './act-create.view-model.ts'

export type ActCreateCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (input: ActWriteInput) => void
}>

export type ActCreateBinding = Readonly<{
  createCommand: ActCreateCommand
  canWrite: boolean
}>

export function useActCreateBinding(): ActCreateBinding {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)
  const mutation = useMutation({
    ...actCreateViewModel.mutation,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['acts'] })
      if (isOk(res)) void navigate({ to: '/parceiros/atos' })
    },
  })

  const data = mutation.data
  const errorTag = mutation.isPending
    ? null
    : data !== undefined && !isOk(data)
      ? actCreateViewModel.toErrorTag(data.error)
      : mutation.isError
        ? actCreateViewModel.unexpectedErrorTag
        : null

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      execute: (input) => {
        mutation.mutate(input)
      },
    },
    canWrite: can(granted, 'collaborator:write'),
  }
}
