/**
 * paymentPositionQueryOptions — data AGNÓSTICA da "Posição de Pagamentos" (#114; sem React). A queryFn devolve
 * o `Result` MAPEADO (`{ data, error }`) p/ o binding ramificar loading/error/ready — o view-model fica puro.
 * Sem input (o BFF compõe a resposta completa por caso de uso). Espelha `dashboard-statistics.query.ts`.
 */
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import type { PaymentPosition } from '#modules/reports/client/data/model/payment-position.model.ts'
import type { ReportsError } from '#modules/reports/client/data/repository/reports-error.ts'

export type PaymentPositionResult = Readonly<{
  data: readonly PaymentPosition[] | null
  error: ReportsError | null
}>

export const paymentPositionQueryKey = ['reports', 'payment-position'] as const

export const paymentPositionQueryOptions = () => ({
  queryKey: paymentPositionQueryKey,
  queryFn: async (): Promise<PaymentPositionResult> => {
    const res = await reportsRepository.getPaymentPosition()
    return res.ok ? { data: res.value, error: null } : { data: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
