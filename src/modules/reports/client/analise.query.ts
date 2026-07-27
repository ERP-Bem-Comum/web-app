/**
 * paymentAnalysisQueryOptions — data AGNÓSTICA da "Análise de Pagamentos" (#446; sem React). A queryFn devolve
 * o `Result` MAPEADO (`{ data, error }`) p/ o binding ramificar loading/error/ready — o view-model fica puro.
 * A janela de consulta (`dueStart/dueEnd` + status) entra na queryKey → trocar o período re-busca. Espelha
 * `posicao.query.ts`/`realizado-x-planejado.query.ts`.
 */
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import type {
  PaymentAnalysis,
  PaymentAnalysisQuery,
} from '#modules/reports/client/data/model/payment-analysis.model.ts'
import type { ReportsError } from '#modules/reports/client/data/repository/reports-error.ts'

export type PaymentAnalysisResult = Readonly<{
  data: PaymentAnalysis | null
  error: ReportsError | null
}>

export const paymentAnalysisQueryKey = (q: PaymentAnalysisQuery) =>
  ['reports', 'payment-analysis', q.dueStart, q.dueEnd, q.status ?? null] as const

export const paymentAnalysisQueryOptions = (query: PaymentAnalysisQuery) => ({
  queryKey: paymentAnalysisQueryKey(query),
  queryFn: async (): Promise<PaymentAnalysisResult> => {
    const res = await reportsRepository.getPaymentAnalysis(query)
    return res.ok ? { data: res.value, error: null } : { data: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
