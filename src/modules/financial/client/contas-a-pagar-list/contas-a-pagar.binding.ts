/**
 * Binding do grid de Contas a Pagar — ADAPTER React (estado de página + queries). Reúne a lista (Fatia 2)
 * e o mapa de Fornecedores (resolve `supplierRef` → nome, já que o DTO fino só traz o id; FIN-LIST-DTO #47)
 * e entrega o `ListState` derivado pela view-model PURA. A page é burra (só consome este hook).
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { contasAPagarQueryOptions } from './contas-a-pagar.query.ts'
import { partnersMapQueryOptions } from './partners-map.binding.ts'
import { contractsMapQueryOptions } from './contracts-map.binding.ts'
import {
  deriveListState,
  type ListState,
  type ResolveSupplier,
  type ResolveSupplierKind,
  type ResolveSupplierDoc,
  type ResolveContract,
  type AdvancedFilters,
  type FilterDimId,
} from './contas-a-pagar.view-model.ts'
import type { DocumentStatus, DocumentType } from '#modules/financial/client/data/model/document.model.ts'

const DEFAULT_PAGE_SIZE = 12

export type SupplierOption = Readonly<{ value: string; label: string }>

export type ContasAPagarBinding = Readonly<{
  state: ListState
  pageSize: number
  // Filtro de status (chips): null = "Todos". Trocar o filtro reseta a página.
  selectedStatus: DocumentStatus | null
  onStatusFilter: (status: DocumentStatus | null) => void
  // Filtros avançados ("Adicionar filtro"): dimensões ativas + valores (server-side).
  activeDims: ReadonlySet<FilterDimId>
  filters: AdvancedFilters
  supplierOptions: readonly SupplierOption[]
  onAddFilter: (id: FilterDimId) => void
  onRemoveFilter: (id: FilterDimId) => void
  onSetVencimento: (from: string | undefined, to: string | undefined) => void
  onSetTipo: (tipo: DocumentType | undefined) => void
  onSetFornecedor: (ref: string | undefined) => void
  onClearFilters: () => void
  onPrev: () => void
  onNext: () => void
  onPageSize: (size: number) => void
}>

export function useContasAPagar(): ContasAPagarBinding {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | null>(null)
  const [activeDims, setActiveDims] = useState<ReadonlySet<FilterDimId>>(() => new Set())
  const [filters, setFilters] = useState<AdvancedFilters>({})
  const partners = useQuery(partnersMapQueryOptions)
  const contracts = useQuery(contractsMapQueryOptions)
  const list = useQuery(
    contasAPagarQueryOptions({
      page,
      pageSize,
      status: selectedStatus ?? undefined,
      type: filters.tipo,
      supplierRef: filters.fornecedor,
      dueFrom: filters.vencimento?.from,
      dueTo: filters.vencimento?.to,
    }),
  )

  const resolveSupplier: ResolveSupplier = (ref) =>
    ref === null ? '—' : (partners.data?.get(ref)?.name ?? ref)
  const resolveKind: ResolveSupplierKind = (ref) =>
    ref === null ? null : (partners.data?.get(ref)?.kind ?? null)
  const resolveDoc: ResolveSupplierDoc = (ref) =>
    ref === null ? null : (partners.data?.get(ref)?.document ?? null)
  const resolveContract: ResolveContract = (ref) => (ref === null ? null : (contracts.data?.get(ref) ?? null))

  const state = deriveListState({
    isLoading: list.isLoading,
    data: list.data,
    resolveSupplier,
    resolveKind,
    resolveDoc,
    resolveContract,
  })

  // Opções do filtro "Fornecedor" — todos os parceiros já carregados (id → nome), ordenados por nome.
  const supplierOptions: readonly SupplierOption[] = Array.from(partners.data?.entries() ?? [])
    .map(([value, p]) => ({ value, label: p.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))

  // Remove uma dimensão ativa E limpa o valor correspondente no `filters`.
  const dropFilterValue = (id: FilterDimId): void => {
    if (id === 'vencimento') setFilters((f) => ({ ...f, vencimento: undefined }))
    else if (id === 'tipo') setFilters((f) => ({ ...f, tipo: undefined }))
    else setFilters((f) => ({ ...f, fornecedor: undefined }))
  }

  return {
    state,
    pageSize,
    selectedStatus,
    onStatusFilter: (status) => {
      setSelectedStatus(status)
      setPage(1)
    },
    activeDims,
    filters,
    supplierOptions,
    onAddFilter: (id) => {
      setActiveDims((prev) => new Set(prev).add(id))
    },
    onRemoveFilter: (id) => {
      setActiveDims((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      dropFilterValue(id)
      setPage(1)
    },
    onSetVencimento: (from, to) => {
      setFilters((f) => ({ ...f, vencimento: { from, to } }))
      setPage(1)
    },
    onSetTipo: (tipo) => {
      setFilters((f) => ({ ...f, tipo }))
      setPage(1)
    },
    onSetFornecedor: (ref) => {
      setFilters((f) => ({ ...f, fornecedor: ref }))
      setPage(1)
    },
    onClearFilters: () => {
      setActiveDims(new Set())
      setFilters({})
      setPage(1)
    },
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
