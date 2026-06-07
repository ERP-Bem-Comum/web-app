/**
 * Binding da edição — ADAPTER React. `useQuery` (pré-preenche) + `useMutation` (update) + RBAC.
 * Navega de volta ao detalhe no `onSuccess`. Sem categorias/canEditSensitive.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { FinancierFormValues } from '#modules/partners/client/data/model/financier.model.ts'
import { financierDetailQueryOptions } from '#modules/partners/client/financier-detail/financier-detail.query.ts'

import { financierUpdateMutationOptions } from './financier-edit.mutation.ts'
import { deriveEditState, type FinancierEditState } from './financier-edit.view-model.ts'

export type FinancierUpdateCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (values: FinancierFormValues) => void
}>

export type FinancierEditBinding = Readonly<{
  state: FinancierEditState
  updateCommand: FinancierUpdateCommand
  canWrite: boolean
}>

export function useFinancierEditBinding(id: string): FinancierEditBinding {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const query = useQuery(financierDetailQueryOptions(id))
  const mutation = useMutation({
    ...financierUpdateMutationOptions,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['financiers'] })
      if (isOk(res)) void navigate({ to: '/parceiros/financiadores/$id', params: { id } })
    },
  })
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)

  const state: FinancierEditState = ((): FinancierEditState => {
    if (query.isPending) return { status: 'loading' }
    const res = query.data
    if (query.isError || res === undefined) {
      return { status: 'error', errorTag: 'partners.error.server' }
    }
    return deriveEditState(res)
  })()

  const mdata = mutation.data
  const errorTag = mutation.isPending
    ? null
    : mdata !== undefined && !isOk(mdata)
      ? partnersErrorTag(mdata.error)
      : mutation.isError
        ? 'partners.error.server'
        : null

  return {
    state,
    updateCommand: {
      running: mutation.isPending,
      errorTag,
      execute: (values) => {
        mutation.mutate({ ...values, id })
      },
    },
    canWrite: can(granted, 'financier:write'),
  }
}
