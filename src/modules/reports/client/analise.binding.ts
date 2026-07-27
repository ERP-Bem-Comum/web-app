/**
 * Binding da "Análise de Pagamentos" — ADAPTER React (§XI). Lê a matriz REAL do core-api (#446, via
 * `reportsRepository.getPaymentAnalysis`) e monta o `AnaliseReport` pelo view-model puro
 * (`analiseReportFromAnalysis`). A View consome só o `state` (união discriminada §IV: loading | error | ready).
 * O empty-state honesto (resposta vazia → months []/planos []) é resolvido DENTRO da `AnaliseReportView`. ZERO
 * React/TanStack no view-model — o acoplamento vive aqui. Espelha `posicao.binding.ts`.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { paymentAnalysisQueryOptions } from './analise.query.ts'
import { analiseReportFromAnalysis, type AnaliseReport } from './analise.view-model.ts'
import { reportsErrorTag } from './data/helpers/reports-error-tag.ts'
import type { ReportsError } from './data/repository/reports-error.ts'
import type { PaymentAnalysisQuery } from './data/model/payment-analysis.model.ts'

export type AnaliseBindingState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; error: ReportsError; errorTag: string }>
  | Readonly<{ status: 'ready'; report: AnaliseReport }>

/**
 * Janela AMPLA (±2 anos do "agora") p/ capturar o dado ESPARSO independentemente do ano do env (dev ≈ 2027, mas
 * o dado é ~2026). O backend devolve tudo dentro da janela; os meses VISÍVEIS vêm do MIN..MAX real da resposta
 * (derivado no view-model), não desta janela. `Date` é permitido no binding (React) — nunca no view-model.
 */
function wideDueWindow(): PaymentAnalysisQuery {
  const year = new Date().getFullYear()
  return { dueStart: `${String(year - 2)}-01-01`, dueEnd: `${String(year + 2)}-01-01` }
}

export function useAnalisePagamentos(): AnaliseBindingState {
  // Estável por mount (queryKey não muda a cada render → sem refetch em loop).
  const range = useMemo(() => wideDueWindow(), [])
  const query = useQuery(paymentAnalysisQueryOptions(range))

  const analysis = query.data?.data ?? null
  const error: ReportsError | null = query.data?.error ?? null

  return useMemo<AnaliseBindingState>(() => {
    if (query.isLoading) return { status: 'loading' }
    if (error !== null) return { status: 'error', error, errorTag: reportsErrorTag(error) }
    if (analysis !== null) return { status: 'ready', report: analiseReportFromAnalysis(analysis) }
    return { status: 'loading' }
  }, [query.isLoading, error, analysis])
}
