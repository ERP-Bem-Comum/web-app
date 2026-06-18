/**
 * Binding da criação de colaborador — ADAPTER React. `useMutation` → Command. Invalida a lista no
 * sucesso. A navegação NÃO acontece aqui: o sucesso DERIVA o flag `succeeded`, a página abre o modal
 * informativo e só navega quando o usuário clica "Entendi". RBAC: `collaborator:write`.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import type { CollaboratorWriteInput } from '#modules/partners/client/data/model/collaborator.model.ts'

import { collaboratorCreateViewModel } from './collaborator-create.view-model.ts'

export type CollaboratorCreateCommand = Readonly<{
  running: boolean
  errorTag: string | null
  // DERIVADO do resultado da mutation: true quando o pré-cadastro concluiu com sucesso (sem erro).
  // A página usa isso para abrir o modal de sucesso (sem setState em efeito).
  succeeded: boolean
  execute: (input: CollaboratorWriteInput) => void
}>

export type CollaboratorCreateBinding = Readonly<{
  createCommand: CollaboratorCreateCommand
  canWrite: boolean
}>

export function useCollaboratorCreateBinding(): CollaboratorCreateBinding {
  const queryClient = useQueryClient()
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)
  const mutation = useMutation({
    ...collaboratorCreateViewModel.mutation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['collaborators'] })
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

  const succeeded = !mutation.isPending && data !== undefined && isOk(data)

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      succeeded,
      execute: (input) => {
        mutation.mutate(input)
      },
    },
    canWrite: can(granted, 'collaborator:write'),
  }
}
