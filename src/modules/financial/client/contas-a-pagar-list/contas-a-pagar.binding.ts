/**
 * Binding do grid de Contas a Pagar — ADAPTER React (estado de página + queries). Reúne a lista (Fatia 2)
 * e o mapa de Fornecedores (resolve `supplierRef` → nome, já que o DTO fino só traz o id; FIN-LIST-DTO #47)
 * e entrega o `ListState` derivado pela view-model PURA. A page é burra (só consome este hook).
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { contasAPagarQueryOptions } from './contas-a-pagar.query.ts'
import { partnersMapQueryOptions } from './partners-map.binding.ts'
import {
  deriveListState,
  type ListState,
  type ResolveSupplier,
  type ResolveSupplierKind,
} from './contas-a-pagar.view-model.ts'

const DEFAULT_PAGE_SIZE = 12

export type ContasAPagarBinding = Readonly<{
  state: ListState
  pageSize: number
  onPrev: () => void
  onNext: () => void
  onPageSize: (size: number) => void
}>

export function useContasAPagar(): ContasAPagarBinding {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const partners = useQuery(partnersMapQueryOptions)
  const list = useQuery(contasAPagarQueryOptions({ page, pageSize }))

  const resolveSupplier: ResolveSupplier = (ref) =>
    ref === null ? '—' : (partners.data?.get(ref)?.name ?? ref)
  const resolveKind: ResolveSupplierKind = (ref) =>
    ref === null ? null : (partners.data?.get(ref)?.kind ?? null)

  const state = deriveListState({ isLoading: list.isLoading, data: list.data, resolveSupplier, resolveKind })

  return {
    state,
    pageSize,
    onPrev: () => {
      setPage((p) => Math.max(1, p - 1))
    },
    onNext: () => {
      setPage((p) => p + 1)
    },
    onPageSize: (size) => {
      setPageSize(size)
      setPage(1)
    },
  }
}
