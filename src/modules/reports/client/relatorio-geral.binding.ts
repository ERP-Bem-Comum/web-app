/**
 * Binding do "Relatório Geral" — ADAPTER React (§XI). Lê a página REAL do core-api (#442, via
 * `reportsRepository.getGeneralReport`) e mapeia cada linha para a de exibição (`ledgerRowFromGeneral`). A View
 * consome só o `state` (união discriminada §IV: loading | error | ready). Paginação SERVER-SIDE: a page passa
 * `{ page, limit, ...filtros }` → a queryKey muda → refetch. ZERO React/TanStack no view-model. Espelha
 * `posicao.binding.ts`.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { generalReportQueryOptions } from './relatorio-geral.query.ts'
import { ledgerRowFromGeneral, type LedgerRow } from './relatorio-geral.view-model.ts'
import { reportsErrorTag } from './data/helpers/reports-error-tag.ts'
import type { ReportsError } from './data/repository/reports-error.ts'
import type { GeneralReportQuery } from './data/model/general-report.model.ts'

// Re-export p/ a page tipar a consulta sem importar de `data/model` (boundary client-ui ↛ client-data).
export type RelatorioGeralQuery = GeneralReportQuery

export type RelatorioGeralPageData = Readonly<{
  rows: readonly LedgerRow[]
  total: number
  page: number
  pageSize: number
}>

export type RelatorioGeralBindingState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; error: ReportsError; errorTag: string }>
  | Readonly<{ status: 'ready'; data: RelatorioGeralPageData }>

/** `query` = página + filtros aplicados. Mudar qualquer campo → refetch (queryKey). */
export function useRelatorioGeral(query: GeneralReportQuery): RelatorioGeralBindingState {
  const q = useQuery(generalReportQueryOptions(query))

  const page = q.data?.data ?? null
  const error: ReportsError | null = q.data?.error ?? null

  return useMemo<RelatorioGeralBindingState>(() => {
    if (q.isLoading) return { status: 'loading' }
    if (error !== null) return { status: 'error', error, errorTag: reportsErrorTag(error) }
    if (page !== null) {
      return {
        status: 'ready',
        data: {
          rows: page.items.map(ledgerRowFromGeneral),
          total: page.total,
          page: page.page,
          pageSize: page.pageSize,
        },
      }
    }
    return { status: 'loading' }
  }, [q.isLoading, error, page])
}
