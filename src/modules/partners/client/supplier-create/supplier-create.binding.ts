/**
 * Binding da criação — ADAPTER React. `useMutation` → Command. Invalida a lista e navega de volta à
 * listagem no sucesso (no `onSuccess`, não num `useEffect` que observa `result` — evita render
 * intermediário e disparo em commits arbitrários).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import type { SupplierWriteInput } from '#modules/partners/client/data/model/supplier.model.ts'

import { serviceCategoriesQueryOptions } from '#modules/partners/client/supplier-list/supplier-list.query.ts'

import { supplierCreateViewModel } from './supplier-create.view-model.ts'

export type SupplierCreateCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (input: SupplierWriteInput) => void
}>

export type SupplierCreateBinding = Readonly<{
  createCommand: SupplierCreateCommand
  canWrite: boolean
  canEditSensitive: boolean
  categories: readonly string[]
}>

export function useSupplierCreateBinding(): SupplierCreateBinding {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)
  const categoriesQuery = useQuery(serviceCategoriesQueryOptions())
  const categories = categoriesQuery.data?.ok ? categoriesQuery.data.value : []
  const mutation = useMutation({
    ...supplierCreateViewModel.mutation,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      if (isOk(res)) void navigate({ to: '/parceiros/fornecedores' })
    },
  })

  const data = mutation.data
  // `isPending` zera a tag enquanto roda — evita piscar o erro da tentativa anterior numa re-execução.
  const errorTag = mutation.isPending
    ? null
    : data !== undefined && !isOk(data)
      ? supplierCreateViewModel.toErrorTag(data.error)
      : mutation.isError
        ? supplierCreateViewModel.unexpectedErrorTag
        : null

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      execute: (input) => {
        mutation.mutate(input)
      },
    },
    canWrite: can(granted, 'supplier:write'),
    canEditSensitive: can(granted, 'supplier:edit-sensitive'),
    categories,
  }
}
