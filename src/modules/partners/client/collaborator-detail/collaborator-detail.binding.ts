/**
 * Binding do detalhe de colaborador — ADAPTER React. `useQuery` (detalhe) + `useMutation` (salvar:
 * pré via update + completo via complete-registration) + RBAC (collaborator:write).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk, type Result } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import { collaboratorRepository } from '#modules/partners/client/data/repository/collaborator.repository.instance.ts'
import type {
  CollaboratorDetail,
  CollaboratorWriteInput,
  CollaboratorCompleteInput,
  CollaboratorExportFile,
} from '#modules/partners/client/data/model/collaborator.model.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'

import {
  deriveDetailState,
  collaboratorDetailViewModel,
  type CollaboratorDetailState,
} from './collaborator-detail.view-model.ts'

export type { CollaboratorDetail } from '#modules/partners/client/data/model/collaborator.model.ts'

export type SaveCollaboratorArgs = Readonly<{
  id: string
  pre: CollaboratorWriteInput
  complete: CollaboratorCompleteInput
  includeComplete: boolean
}>

export type CollaboratorSaveCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (args: SaveCollaboratorArgs) => void
}>

/** Comando de export do histórico (CSV). O download (Blob/anchor) é feito na UI via `onDownload`. */
export type CollaboratorExportHistoryCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: () => void
}>

export type CollaboratorDetailBinding = Readonly<{
  state: CollaboratorDetailState
  saveCommand: CollaboratorSaveCommand
  exportHistoryCommand: CollaboratorExportHistoryCommand
  canWrite: boolean
}>

export function useCollaboratorDetailBinding(
  id: string,
  onSaved: () => void,
  onHistoryFile: (file: CollaboratorExportFile) => void,
): CollaboratorDetailBinding {
  const queryClient = useQueryClient()
  const query = useQuery(collaboratorDetailViewModel.query(id))
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)

  const exportMutation = useMutation({
    mutationKey: ['collaborators', 'export-history', id] as const,
    mutationFn: (): Promise<Result<CollaboratorExportFile, PartnersError>> =>
      collaboratorRepository.exportHistory(id),
    onSuccess: (res) => {
      if (isOk(res)) onHistoryFile(res.value)
    },
  })

  const mutation = useMutation({
    mutationKey: ['collaborators', 'save'],
    // Salva o pré (update); se houver dados do cadastro completo, também persiste a 2ª etapa.
    mutationFn: async (vars: SaveCollaboratorArgs): Promise<Result<CollaboratorDetail, PartnersError>> => {
      const updated = await collaboratorRepository.update({ id: vars.id, ...vars.pre })
      if (!isOk(updated) || !vars.includeComplete) return updated
      return collaboratorRepository.completeRegistration(vars.complete)
    },
    onSuccess: (res) => {
      if (isOk(res)) {
        void queryClient.invalidateQueries({ queryKey: ['collaborators'] })
        onSaved()
      }
    },
  })

  const state: CollaboratorDetailState = ((): CollaboratorDetailState => {
    if (query.isPending) return { status: 'loading' }
    const res = query.data
    if (query.isError || res === undefined) return { status: 'error', errorTag: 'partners.error.server' }
    return deriveDetailState(res)
  })()

  const mdata = mutation.data
  const saveErrorTag = mutation.isPending
    ? null
    : mdata !== undefined && !isOk(mdata)
      ? partnersErrorTag(mdata.error)
      : mutation.isError
        ? 'partners.error.server'
        : null

  const xdata = exportMutation.data
  const exportErrorTag = exportMutation.isPending
    ? null
    : xdata !== undefined && !isOk(xdata)
      ? partnersErrorTag(xdata.error)
      : exportMutation.isError
        ? 'partners.error.server'
        : null

  return {
    state,
    saveCommand: {
      running: mutation.isPending,
      errorTag: saveErrorTag,
      execute: (args) => {
        mutation.mutate(args)
      },
    },
    exportHistoryCommand: {
      running: exportMutation.isPending,
      errorTag: exportErrorTag,
      execute: () => {
        if (!exportMutation.isPending) exportMutation.mutate()
      },
    },
    canWrite: can(granted, 'collaborator:write'),
  }
}
