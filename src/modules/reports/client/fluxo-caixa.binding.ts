/**
 * Binding do "Fluxo de Caixa" — ADAPTER React (§XI). Lê a resposta REAL do core-api (#590, via
 * `reportsRepository.getCashflowReport`) e monta o `FluxoReport` pelo view-model puro (`buildReportFromCashflow`).
 * A View consome só o `state` (união discriminada §IV: loading | error | ready). O empty-state honesto
 * (Saídas/chart vazios · Entradas sempre `[]`) é resolvido DENTRO das views. ZERO React/TanStack no view-model
 * — o acoplamento vive aqui. Espelha `analise.binding.ts`/`posicao.binding.ts`.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { cashflowReportQueryOptions } from './fluxo-caixa.query.ts'
import { buildReportFromCashflow, type FluxoReport } from './fluxo-caixa.view-model.ts'
import { reportsErrorTag } from './data/helpers/reports-error-tag.ts'
import type { ReportsError } from './data/repository/reports-error.ts'
import type { CashflowFilter } from './data/model/cashflow.model.ts'

// Re-export p/ a page tipar o filtro sem importar de `data/model` (boundary client-ui ↛ client-data).
export type FluxoCaixaFilter = CashflowFilter

export type FluxoBindingState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; error: ReportsError; errorTag: string }>
  | Readonly<{ status: 'ready'; report: FluxoReport }>

/** Filtro estável por mount (queryKey não muda a cada render → sem refetch em loop). Sem recorte = tudo. */
const EMPTY_FILTER: CashflowFilter = {}

/**
 * `filter` opcional: ausente → sem recorte (a tela abre mostrando tudo). Quando a page aplicar filtros (via
 * "Filtrar"), passa o `CashflowFilter` → a queryKey muda → refetch.
 */
export function useFluxoCaixa(filter: CashflowFilter = EMPTY_FILTER): FluxoBindingState {
  const q = useQuery(cashflowReportQueryOptions(filter))

  const data = q.data?.data ?? null
  const error: ReportsError | null = q.data?.error ?? null

  return useMemo<FluxoBindingState>(() => {
    if (q.isLoading) return { status: 'loading' }
    if (error !== null) return { status: 'error', error, errorTag: reportsErrorTag(error) }
    if (data !== null) {
      return { status: 'ready', report: buildReportFromCashflow(data.payables, data.chart) }
    }
    return { status: 'loading' }
  }, [q.isLoading, error, data])
}
