/**
 * Binding do detalhe de colaborador — ADAPTER React. `useQuery` (detalhe) + `useMutation` (salvar:
 * pré via update + completo via complete-registration) + `useMutation` (inativar com motivo / reativar —
 * spec 133) + RBAC (collaborator:write).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk, type Result } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import { collaboratorRepository } from '#modules/partners/client/data/repository/collaborator.repository.instance.ts'
import type {
  CollaboratorDetail,
  CollaboratorUpdateInput,
  CollaboratorCompleteInput,
  CollaboratorExportFile,
  DeactivationReason,
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
  pre: CollaboratorUpdateInput
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

/** Inativar (motivo obrigatório) ou reativar. `onDone` fecha o diálogo só quando deu certo. */
export type CollaboratorStatusCommand = Readonly<{
  running: boolean
  errorTag: string | null
  deactivate: (reason: DeactivationReason, onDone: () => void) => void
  reactivate: (onDone: () => void) => void
  /** Esquece o erro da última tentativa (ao fechar o diálogo). */
  clearError: () => void
}>

type StatusVars =
  Readonly<{ action: 'deactivate'; reason: DeactivationReason }> | Readonly<{ action: 'reactivate' }>

export type CollaboratorDetailBinding = Readonly<{
  state: CollaboratorDetailState
  saveCommand: CollaboratorSaveCommand
  exportHistoryCommand: CollaboratorExportHistoryCommand
  statusCommand: CollaboratorStatusCommand
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

  const statusMutation = useMutation({
    mutationKey: ['collaborators', 'status', id] as const,
    mutationFn: (vars: StatusVars): Promise<Result<CollaboratorDetail, PartnersError>> =>
      vars.action === 'deactivate'
        ? collaboratorRepository.deactivate({ id, reason: vars.reason })
        : collaboratorRepository.reactivate(id),
    onSuccess: (res) => {
      // O BFF devolve o detalhe já atualizado: troca o cache do detalhe e invalida as listas.
      if (isOk(res)) {
        queryClient.setQueryData(collaboratorDetailViewModel.query(id).queryKey, res)
        void queryClient.invalidateQueries({ queryKey: ['collaborators'] })
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

  const sdata = statusMutation.data
  const statusErrorTag = statusMutation.isPending
    ? null
    : sdata !== undefined && !isOk(sdata)
      ? partnersErrorTag(sdata.error)
      : statusMutation.isError
        ? 'partners.error.server'
        : null

  const runStatus = (vars: StatusVars, onDone: () => void): void => {
    if (statusMutation.isPending) return
    statusMutation.mutate(vars, {
      onSuccess: (res) => {
        if (isOk(res)) onDone()
      },
    })
  }

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
    statusCommand: {
      running: statusMutation.isPending,
      errorTag: statusErrorTag,
      deactivate: (reason, onDone) => {
        runStatus({ action: 'deactivate', reason }, onDone)
      },
      reactivate: (onDone) => {
        runStatus({ action: 'reactivate' }, onDone)
      },
      clearError: () => {
        if (!statusMutation.isPending) statusMutation.reset()
      },
    },
    canWrite: can(granted, 'collaborator:write'),
  }
}
