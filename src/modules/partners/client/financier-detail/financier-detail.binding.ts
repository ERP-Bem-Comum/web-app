/**
 * Binding do detalhe — ADAPTER React. `useQuery` (detalhe) + mutations (status + update inline) + RBAC.
 * Edição inline na própria tela (padrão do detalhe de Colaboradores). Sem campos sensíveis.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { StatusAction } from '#modules/partners/client/domain/financier.types.ts'
import type { FinancierFormValues } from '#modules/partners/client/data/model/financier.model.ts'
import { financierUpdateMutationOptions } from '#modules/partners/client/financier-edit/financier-edit.mutation.ts'

import { deriveDetailState, financierDetailViewModel, type FinancierDetailState } from './financier-detail.view-model.ts'
import { financierStatusMutationOptions } from './financier-status.mutation.ts'

export type FinancierStatusCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (id: string, action: StatusAction) => void
}>

export type FinancierSaveCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (values: FinancierFormValues) => void
}>

export type FinancierDetailBinding = Readonly<{
  state: FinancierDetailState
  statusCommand: FinancierStatusCommand
  saveCommand: FinancierSaveCommand
  canWrite: boolean
}>

export function useFinancierDetailBinding(id: string, onSaved?: () => void): FinancierDetailBinding {
  const queryClient = useQueryClient()
  const query = useQuery(financierDetailViewModel.query(id))
  const mutation = useMutation({
    ...financierStatusMutationOptions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['financiers'] })
    },
  })
  const saveMutation = useMutation({
    ...financierUpdateMutationOptions,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['financiers'] })
      if (isOk(res)) onSaved?.()
    },
  })
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)

  const state: FinancierDetailState = ((): FinancierDetailState => {
    if (query.isPending) return { status: 'loading' }
    const res = query.data
    if (query.isError || res === undefined) {
      return { status: 'error', errorTag: 'partners.error.server' }
    }
    return deriveDetailState(res)
  })()

  const mdata = mutation.data
  const statusErrorTag = mutation.isPending
    ? null
    : mdata !== undefined && !isOk(mdata)
      ? partnersErrorTag(mdata.error)
      : mutation.isError
        ? 'partners.error.server'
        : null

  const sdata = saveMutation.data
  const saveErrorTag = saveMutation.isPending
    ? null
    : sdata !== undefined && !isOk(sdata)
      ? partnersErrorTag(sdata.error)
      : saveMutation.isError
        ? 'partners.error.server'
        : null

  return {
    state,
    statusCommand: {
      running: mutation.isPending,
      errorTag: statusErrorTag,
      execute: (fid, action) => {
        mutation.mutate({ id: fid, action })
      },
    },
    saveCommand: {
      running: saveMutation.isPending,
      errorTag: saveErrorTag,
      execute: (values) => {
        saveMutation.mutate({ ...values, id })
      },
    },
    canWrite: can(granted, 'financier:write'),
  }
}
