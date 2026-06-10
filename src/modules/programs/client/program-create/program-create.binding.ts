/**
 * Binding da criação de Programa — ADAPTER React. `useMutation` → Command. Invalida a lista e navega à
 * listagem no sucesso. RBAC: program:write.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/programs/client/data/helpers/can.ts'
import { programsErrorTag } from '#modules/programs/client/data/helpers/programs-error-tag.ts'
import { formToCreateInput, type ProgramFormValues } from '#modules/programs/client/data/model/program.model.ts'

import { programCreateMutationOptions } from './program-create.mutation.ts'

export type ProgramCreateCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (values: ProgramFormValues) => void
}>

export type ProgramCreateBinding = Readonly<{
  createCommand: ProgramCreateCommand
  canCreate: boolean
}>

export function useProgramCreateBinding(): ProgramCreateBinding {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)
  const mutation = useMutation({
    ...programCreateMutationOptions,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['programs'] })
      if (isOk(res)) void navigate({ to: '/programas' })
    },
  })

  const data = mutation.data
  const errorTag = mutation.isPending
    ? null
    : data !== undefined && !isOk(data)
      ? programsErrorTag(data.error)
      : mutation.isError
        ? 'programs.error.server'
        : null

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      execute: (values) => { mutation.mutate(formToCreateInput(values)) },
    },
    canCreate: can(granted, 'program:write'),
  }
}
