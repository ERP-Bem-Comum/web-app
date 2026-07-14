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
import type { RawSupplierRow } from './data/suppliers-without-contract.placeholder.ts'
import { reportsErrorTag } from './data/helpers/reports-error-tag.ts'
import type { ReportsError } from './data/repository/reports-error.ts'

export type SuppliersWithoutContractState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; error: ReportsError; errorTag: string }>
  | Readonly<{ status: 'ready'; rawRows: readonly RawSupplierRow[] }>

export function useSuppliersWithoutContract(): SuppliersWithoutContractState {
  const query = useQuery(suppliersWithoutContractQueryOptions())

  const suppliers = query.data?.data ?? null
  const error: ReportsError | null = query.data?.error ?? null

  return useMemo<SuppliersWithoutContractState>(() => {
    if (query.isLoading) return { status: 'loading' }
    if (error !== null) return { status: 'error', error, errorTag: reportsErrorTag(error) }
    if (suppliers !== null) return { status: 'ready', rawRows: toRawSupplierRows(suppliers) }
    return { status: 'loading' }
  }, [query.isLoading, error, suppliers])
}
