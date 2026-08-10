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
import {
  analiseReportFromAnalysis,
  filterPaymentAnalysis,
  type AnaliseReport,
  type AnaliseSelection,
} from './analise.view-model.ts'
import { reportsErrorTag } from './data/helpers/reports-error-tag.ts'
import type { ReportsError } from './data/repository/reports-error.ts'
import type { PaymentAnalysisQuery } from './data/model/payment-analysis.model.ts'

// Re-export p/ a page tipar o período aplicado sem importar de `data/model` (boundary client-ui ↛ client-data).
export type AnalisePagamentosQuery = PaymentAnalysisQuery

export type AnaliseBindingState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; error: ReportsError; errorTag: string }>
  | Readonly<{ status: 'ready'; report: AnaliseReport }>

/**
 * Janela AMPLA (±2 anos do "agora") p/ capturar o dado ESPARSO independentemente do ano do env (dev ≈ 2027, mas
 * o dado é ~2026). O backend devolve tudo dentro da janela; os meses VISÍVEIS vêm do MIN..MAX real da resposta
 * (derivado no view-model), não desta janela. `Date` é permitido no binding (React) — nunca no view-model.
 */
export function wideDueWindow(): PaymentAnalysisQuery {
  const year = new Date().getFullYear()
  return { dueStart: `${String(year - 2)}-01-01`, dueEnd: `${String(year + 2)}-01-01` }
}

/** Sem recorte client-side (referência estável — não invalida o `useMemo` a cada render). */
const NO_SELECTION: AnaliseSelection = {}

/**
 * `query` opcional: quando ausente/vazio, cai no `wideDueWindow` (a tela abre mostrando o dado). Quando a page
 * aplica um período (via "Filtrar"), passa `{ dueStart, dueEnd, status? }` → a queryKey muda → refetch.
 *
 * `selection` é o recorte que o #446 NÃO aceita mas o grão da resposta permite (Programa/Plano/Centro de
 * Custo): aplica sobre o dado já baixado, sem refetch — logo não entra na queryKey. Ver
 * `filterPaymentAnalysis`.
 */
export function useAnalisePagamentos(
  query?: PaymentAnalysisQuery,
  selection: AnaliseSelection = NO_SELECTION,
): AnaliseBindingState {
  // Janela default estável por mount (queryKey não muda a cada render → sem refetch em loop). Quando a page
  // passa um `query` aplicado, ele vence; sem query, usa a janela ampla.
  const fallback = useMemo(() => wideDueWindow(), [])
  const range = query ?? fallback
  const q = useQuery(paymentAnalysisQueryOptions(range))

  const analysis = q.data?.data ?? null
  const error: ReportsError | null = q.data?.error ?? null

  return useMemo<AnaliseBindingState>(() => {
    if (q.isLoading) return { status: 'loading' }
    if (error !== null) return { status: 'error', error, errorTag: reportsErrorTag(error) }
    if (analysis !== null) {
      return {
        status: 'ready',
        report: analiseReportFromAnalysis(filterPaymentAnalysis(analysis, selection)),
      }
    }
    return { status: 'loading' }
  }, [q.isLoading, error, analysis, selection])
}
