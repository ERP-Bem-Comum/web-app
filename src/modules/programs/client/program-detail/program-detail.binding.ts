/**
 * Binding do detalhe de Programa — ADAPTER React. `useQuery` (detalhe) + mutation de edição inline +
 * RBAC. canEdit = program:write. Espelha o detalhe de Usuários/ACT.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/programs/client/data/helpers/can.ts'
import { programsErrorTag } from '#modules/programs/client/data/helpers/programs-error-tag.ts'
import {
  formToCreateInput,
  type ProgramFormValues,
} from '#modules/programs/client/data/model/program.model.ts'

import {
  useProgramLogo,
  useProgramLogoUpload,
  type ProgramLogoView,
  type ProgramLogoUploadCommand,
} from '#modules/programs/client/program-logo/program-logo.binding.ts'

import {
  deriveDetailState,
  programDetailViewModel,
  type ProgramDetailState,
} from './program-detail.view-model.ts'
import { programUpdateMutationOptions } from './program-update.mutation.ts'

export type ProgramSaveCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (values: ProgramFormValues, version: number) => void
}>

export type ProgramDetailBinding = Readonly<{
  state: ProgramDetailState
  saveCommand: ProgramSaveCommand
  canEdit: boolean
  logo: ProgramLogoView
  logoUpload: ProgramLogoUploadCommand
}>

export function useProgramDetailBinding(id: string, onSaved?: () => void): ProgramDetailBinding {
  const queryClient = useQueryClient()
  const query = useQuery(programDetailViewModel.query(id))
  const saveMutation = useMutation({
    ...programUpdateMutationOptions,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['programs'] })
      if (isOk(res)) onSaved?.()
    },
  })
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)

  // Logo: display (só busca se houver logoKey) + upload.
  const logoKey = query.data !== undefined && isOk(query.data) ? query.data.value.logoKey : null
  const logo = useProgramLogo(id, logoKey)
  const logoUpload = useProgramLogoUpload(id)

  const state: ProgramDetailState = ((): ProgramDetailState => {
    if (query.isPending) return { status: 'loading' }
    const res = query.data
    if (query.isError || res === undefined) return { status: 'error', errorTag: 'programs.error.server' }
    return deriveDetailState(res)
  })()

  const sdata = saveMutation.data
  const saveErrorTag = saveMutation.isPending
    ? null
    : sdata !== undefined && !isOk(sdata)
      ? programsErrorTag(sdata.error)
      : saveMutation.isError
        ? 'programs.error.server'
        : null

  return {
    state,
    saveCommand: {
      running: saveMutation.isPending,
      errorTag: saveErrorTag,
      execute: (values, version) => {
        saveMutation.mutate({ ...formToCreateInput(values), version, id })
      },
    },
    canEdit: can(granted, 'program:write'),
    logo,
    logoUpload,
  }
}
