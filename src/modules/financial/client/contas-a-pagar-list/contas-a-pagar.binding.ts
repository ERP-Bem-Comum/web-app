/**
 * Binding do grid de Contas a Pagar — ADAPTER React (estado de página + queries). O fornecedor (nome +
 * CNPJ) vem RESOLVIDO no item da lista pelo read-model do backend (#47 US2) — sem mais o workaround de
 * mapa de parceiros na lista. Só o nº do contrato ainda é resolvido via contracts-map. A page é burra.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { contasAPagarQueryOptions } from './contas-a-pagar.query.ts'
import { contractsMapQueryOptions } from './contracts-map.binding.ts'
import { deriveListState, type ListState, type ResolveContract } from './contas-a-pagar.view-model.ts'

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
  const contracts = useQuery(contractsMapQueryOptions)
  const list = useQuery(contasAPagarQueryOptions({ page, pageSize }))

  const resolveContract: ResolveContract = (ref) => (ref === null ? null : (contracts.data?.get(ref) ?? null))

  const state = deriveListState({
    isLoading: list.isLoading,
    data: list.data,
    resolveContract,
  })

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
