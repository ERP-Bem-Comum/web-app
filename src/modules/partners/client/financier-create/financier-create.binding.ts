/**
 * Binding da criação — ADAPTER React. `useMutation` → Command. Invalida a lista e navega de volta à
 * listagem no sucesso (no `onSuccess`). Sem categorias e sem `canEditSensitive` (financiador não tem
 * campos sensíveis).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import type { FinancierWriteInput } from '#modules/partners/client/data/model/financier.model.ts'

import { financierCreateViewModel } from './financier-create.view-model.ts'

export type FinancierCreateCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (input: FinancierWriteInput) => void
}>

export type FinancierCreateBinding = Readonly<{
  createCommand: FinancierCreateCommand
  canWrite: boolean
}>

export function useFinancierCreateBinding(): FinancierCreateBinding {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)
  const mutation = useMutation({
    ...financierCreateViewModel.mutation,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['financiers'] })
      if (isOk(res)) void navigate({ to: '/parceiros/financiadores' })
    },
  })

  const data = mutation.data
  const errorTag = mutation.isPending
    ? null
    : data !== undefined && !isOk(data)
      ? financierCreateViewModel.toErrorTag(data.error)
      : mutation.isError
        ? financierCreateViewModel.unexpectedErrorTag
        : null

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      execute: (input) => {
        mutation.mutate(input)
      },
    },
    canWrite: can(granted, 'financier:write'),
  }
}
