/**
 * Binding da criação de colaborador — ADAPTER React. `useMutation` → Command. Invalida a lista e
 * navega à listagem no sucesso (no `onSuccess`, não num efeito). RBAC: `collaborator:write`.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import type { CollaboratorWriteInput } from '#modules/partners/client/data/model/collaborator.model.ts'

import { collaboratorCreateViewModel } from './collaborator-create.view-model.ts'

export type CollaboratorCreateCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (input: CollaboratorWriteInput) => void
}>

export type CollaboratorCreateBinding = Readonly<{
  createCommand: CollaboratorCreateCommand
  canWrite: boolean
}>

export function useCollaboratorCreateBinding(): CollaboratorCreateBinding {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)
  const mutation = useMutation({
    ...collaboratorCreateViewModel.mutation,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['collaborators'] })
      if (isOk(res)) void navigate({ to: '/parceiros/colaboradores' })
    },
  })

  const data = mutation.data
  const errorTag = mutation.isPending
    ? null
    : data !== undefined && !isOk(data)
      ? collaboratorCreateViewModel.toErrorTag(data.error)
      : mutation.isError
        ? collaboratorCreateViewModel.unexpectedErrorTag
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
