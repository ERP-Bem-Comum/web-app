/**
 * Binding do grid de Contas a Pagar — ADAPTER React (estado de página + queries). Reúne a lista (Fatia 2)
 * e o mapa de Fornecedores (resolve `supplierRef` → nome, já que o DTO fino só traz o id; FIN-LIST-DTO #47)
 * e entrega o `ListState` derivado pela view-model PURA. A page é burra (só consome este hook).
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { listSuppliersFn } from '#modules/partners/public-api/index.ts'

import { contasAPagarQueryOptions } from './contas-a-pagar.query.ts'
import { deriveListState, type ListState, type ResolveSupplier } from './contas-a-pagar.view-model.ts'

const PAGE_SIZE = 12

const suppliersMapQueryOptions = {
  queryKey: ['financial', 'suppliers-map'] as const,
  queryFn: async (): Promise<ReadonlyMap<string, string>> => {
    const res = await listSuppliersFn({ data: { active: true, limit: 100 } })
    return new Map(res.ok ? res.data.items.map((s) => [s.id, s.name] as const) : [])
  },
  staleTime: 60_000,
}

export type ContasAPagarBinding = Readonly<{
  state: ListState
  onPrev: () => void
  onNext: () => void
}>

export function useContasAPagar(): ContasAPagarBinding {
  const [page, setPage] = useState(1)
  const suppliers = useQuery(suppliersMapQueryOptions)
  const list = useQuery(contasAPagarQueryOptions({ page, pageSize: PAGE_SIZE }))

  const resolveSupplier: ResolveSupplier = (ref) => (ref === null ? '—' : (suppliers.data?.get(ref) ?? ref))

  const state = deriveListState({ isLoading: list.isLoading, data: list.data, resolveSupplier })

  return {
    state,
    onPrev: () => {
      setPage((p) => Math.max(1, p - 1))
    },
    onNext: () => {
      setPage((p) => p + 1)
    },
  }
}
