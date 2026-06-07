/**
 * Binding da criação — ADAPTER React. `useMutation` → Command. Invalida a lista no sucesso.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { isOk } from '#shared/primitives/result.ts'
import { can, type PartnerPermission } from '#modules/partners/client/data/helpers/can.ts'
import type {
  SupplierDetail,
  SupplierWriteInput,
} from '#modules/partners/client/data/model/supplier.model.ts'

import { serviceCategoriesQueryOptions } from '#modules/partners/client/supplier-list/supplier-list.query.ts'

import { supplierCreateViewModel } from './supplier-create.view-model.ts'

export type SupplierCreateCommand = Readonly<{
  running: boolean
  errorTag: string | null
  result: SupplierDetail | null
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
  const current = useCurrentUser()
  const granted = (current.user?.permissions ?? []) as readonly PartnerPermission[]
  const categoriesQuery = useQuery(serviceCategoriesQueryOptions())
  const categories = categoriesQuery.data?.ok ? categoriesQuery.data.value : []
  const mutation = useMutation({
    ...supplierCreateViewModel.mutation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })

  const data = mutation.data
  const errorTag =
    data !== undefined && !isOk(data)
      ? supplierCreateViewModel.toErrorTag(data.error)
      : mutation.isError
        ? supplierCreateViewModel.unexpectedErrorTag
        : null

  return {
    createCommand: {
      running: mutation.isPending,
      errorTag,
      result: data !== undefined && isOk(data) ? data.value : null,
      execute: (input) => {
        mutation.mutate(input)
      },
    },
    canWrite: can(granted, 'supplier:write'),
    canEditSensitive: can(granted, 'supplier:edit-sensitive'),
    categories,
  }
}
