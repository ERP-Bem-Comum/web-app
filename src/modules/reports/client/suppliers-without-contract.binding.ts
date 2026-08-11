/**
 * Binding de "Fornecedores sem Contrato" — ADAPTER React (§XI). Lê os fornecedores REAIS do core-api (via
 * `reportsRepository.getSuppliersWithoutContract`) e entrega as LINHAS CRUAS (`RawSupplierRow[]`) já adaptadas
 * pelo view-model puro (`toRawSupplierRows`). A page aplica o LIMITE (UI-state reativo) via
 * `aggregateSuppliers(rawRows, limiteCents)` — por isso o binding NÃO agrega aqui (o limite muda enquanto o
 * usuário digita). A View consome o `state` (união discriminada §IV: loading | error | ready).
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { suppliersWithoutContractQueryOptions } from './suppliers-without-contract.query.ts'
import { toRawSupplierRows } from './suppliers-without-contract.view-model.ts'
import { reportsPartnersMapQueryOptions, EMPTY_PARTNERS_MAP } from './reports-partners-map.binding.ts'
import type { RawSupplierRow } from './data/suppliers-without-contract.placeholder.ts'
import { reportsErrorTag } from './data/helpers/reports-error-tag.ts'
import type { ReportsError } from './data/repository/reports-error.ts'
import type { SuppliersWithoutContractFilter } from './data/model/supplier-without-contract.model.ts'

export type SuppliersWithoutContractState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; error: ReportsError; errorTag: string }>
  | Readonly<{ status: 'ready'; rawRows: readonly RawSupplierRow[] }>

// Re-export p/ a page tipar o filtro aplicado sem importar de `data/model` (boundary client-ui ↛ client-data).
export type SuppliersFilter = SuppliersWithoutContractFilter

/** Sem recorte (referência estável — não troca a queryKey a cada render). */
const NO_FILTER: SuppliersWithoutContractFilter = {}

/**
 * `filter` aplicado (#694): entra na queryKey → "Filtrar" re-busca no SERVIDOR. Ausente = sem recorte, e a
 * tela abre mostrando TUDO (o filtro é recorte, não pré-requisito).
 */
export function useSuppliersWithoutContract(
  filter: SuppliersWithoutContractFilter = NO_FILTER,
): SuppliersWithoutContractState {
  const query = useQuery(suppliersWithoutContractQueryOptions(filter))
  // Mapa de parceiros p/ resolver o favorecido não-fornecedor client-side (best-effort; não bloqueia).
  const partnersQuery = useQuery(reportsPartnersMapQueryOptions())

  const suppliers = query.data?.data ?? null
  const error: ReportsError | null = query.data?.error ?? null
  const partnersMap = partnersQuery.data ?? EMPTY_PARTNERS_MAP

  return useMemo<SuppliersWithoutContractState>(() => {
    if (query.isLoading) return { status: 'loading' }
    if (error !== null) return { status: 'error', error, errorTag: reportsErrorTag(error) }
    if (suppliers !== null) return { status: 'ready', rawRows: toRawSupplierRows(suppliers, partnersMap) }
    return { status: 'loading' }
  }, [query.isLoading, error, suppliers, partnersMap])
}
