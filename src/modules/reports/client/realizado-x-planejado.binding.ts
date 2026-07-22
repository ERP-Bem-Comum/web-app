/**
 * Binding do relatório "Realizado × Planejado" — ADAPTER React (§XI). Lê a árvore REAL do core-api
 * (`GET /reports/realized`, via `reportsRepository.getRealizedReport`) e entrega já AGREGADA pelo view-model
 * puro (`aggregateBudgetTree` + `grandTotal`). A View consome o `state` (união discriminada §IV:
 * loading | error | ready). Espelha `equipe.binding.ts`.
 *
 * O BFF entrega linhas ACHATADAS (uma por subcategoria); a re-agregação no client reusa toda a máquina
 * front-first já testada (árvore, gráficos, CSV) sem duplicar regra. `rawRows` segue no estado ready p/ o CSV.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { realizadoReportQueryOptions } from './realizado-x-planejado.query.ts'
import {
  aggregateBudgetTree,
  grandTotal,
  type BudgetTreeRow,
  type GrandTotal,
} from './realizado-x-planejado.view-model.ts'
import { reportsErrorTag } from './data/helpers/reports-error-tag.ts'
import type { ReportsError } from './data/repository/reports-error.ts'
import type { RealizedBudgetRow, RealizedReportQuery } from './data/model/realized-report.model.ts'

export type RealizadoBindingState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; error: ReportsError; errorTag: string }>
  | Readonly<{
      status: 'ready'
      rows: readonly BudgetTreeRow[]
      total: GrandTotal
      rawRows: readonly RealizedBudgetRow[]
    }>

export function useRealizadoReport(query: RealizedReportQuery): RealizadoBindingState {
  const q = useQuery(realizadoReportQueryOptions(query))
  const rawRows = q.data?.data ?? null
  const error: ReportsError | null = q.data?.error ?? null

  return useMemo<RealizadoBindingState>(() => {
    if (q.isLoading) return { status: 'loading' }
    if (error !== null) return { status: 'error', error, errorTag: reportsErrorTag(error) }
    if (rawRows !== null) {
      const rows = aggregateBudgetTree(rawRows)
      return { status: 'ready', rows, total: grandTotal(rows), rawRows }
    }
    return { status: 'loading' }
  }, [q.isLoading, error, rawRows])
}
