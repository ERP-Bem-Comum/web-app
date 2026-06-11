/**
 * Binding da listagem de Colaboradores — ADAPTER React (§XI). `useQuery` + RBAC (collaborator:write
 * → canCreate) + comando de IMPORTAÇÃO CSV (mutation → relatório criados/falhas). Espelha `act-list`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import { collaboratorRepository } from '#modules/partners/client/data/repository/collaborator.repository.instance.ts'
import type { CollaboratorListFilters } from '#modules/partners/client/data/collaborator-list-filters.schema.ts'
import type { CollaboratorImportInput, CollaboratorImportResult } from '#modules/partners/client/data/model/collaborator.model.ts'

import {
  mapResponseToRows,
  collaboratorListViewModel,
  type CollaboratorListState,
} from './collaborator-list.view-model.ts'

export type CollaboratorImportCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: CollaboratorImportResult | null
  execute: (input: CollaboratorImportInput) => void
  reset: () => void
}>

export type CollaboratorListBinding = Readonly<{
  state: CollaboratorListState
  canCreate: boolean
  importCommand: CollaboratorImportCommand
}>

export function useCollaboratorListBinding(filters: CollaboratorListFilters): CollaboratorListBinding {
  const queryClient = useQueryClient()
  const query = useQuery(collaboratorListViewModel.query(filters))
  const current = useCurrentUser()
  const importMutation = useMutation({
    mutationKey: ['collaborators', 'import'] as const,
    mutationFn: (input: CollaboratorImportInput) => collaboratorRepository.importCsv(input),
    onSuccess: (res) => {
      if (isOk(res)) void queryClient.invalidateQueries({ queryKey: ['collaborators'] })
    },
  })

  const granted = grantedPermissions(current.user?.permissions)
  const canCreate = can(granted, 'collaborator:write')

  const idata = importMutation.data
  const importCommand: CollaboratorImportCommand = {
    running: importMutation.isPending,
    errorTag: importMutation.isPending
      ? null
      : idata !== undefined && !isOk(idata)
        ? partnersErrorTag(idata.error)
        : importMutation.isError
          ? 'partners.error.server'
          : null,
    result: idata !== undefined && isOk(idata) ? idata.value : null,
    execute: (input) => { importMutation.mutate(input) },
    reset: () => { importMutation.reset() },
  }

  const state: CollaboratorListState = ((): CollaboratorListState => {
    if (query.isPending) return { status: 'loading' }
    const res = query.data
    if (query.isError || res === undefined) return { status: 'error', errorTag: 'partners.error.server' }
    if (!res.ok) return { status: 'error', errorTag: partnersErrorTag(res.error) }
    return { status: 'ready', rows: mapResponseToRows(res.value), meta: res.value.meta }
  })()

  return { state, canCreate, importCommand }
}
