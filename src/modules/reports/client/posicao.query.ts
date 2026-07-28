/**
 * paymentPositionQueryOptions — data AGNÓSTICA da "Posição de Pagamentos" (#114/#588; sem React). A queryFn
 * devolve o `Result` MAPEADO (`{ data, error }`) p/ o binding ramificar loading/error/ready — o view-model fica
 * puro. O FILTRO (#588) entra na queryKey → aplicar um filtro diferente re-busca. Espelha `realizado-x-planejado.query.ts`.
 */
import { reportsRepository } from '#modules/reports/client/data/repository/reports.repository.instance.ts'
import type {
  PaymentPosition,
  PaymentPositionFilter,
} from '#modules/reports/client/data/model/payment-position.model.ts'
import type { ReportsError } from '#modules/reports/client/data/repository/reports-error.ts'

export type PaymentPositionResult = Readonly<{
  data: readonly PaymentPosition[] | null
  error: ReportsError | null
}>

/** QueryKey estável a partir do filtro aplicado (campos ausentes → null, ordem fixa). */
export const paymentPositionQueryKey = (f: PaymentPositionFilter) =>
  [
    'reports',
    'payment-position',
    f.budgetPlanRef ?? null,
    f.cedenteAccountRef ?? null,
    f.costCenterRef ?? null,
    f.categoryRef ?? null,
    f.subcategoryRef ?? null,
    f.supplierRef ?? null,
    f.dueFrom ?? null,
    f.dueTo ?? null,
    f.status ?? null,
  ] as const

export const paymentPositionQueryOptions = (filter: PaymentPositionFilter) => ({
  queryKey: paymentPositionQueryKey(filter),
  queryFn: async (): Promise<PaymentPositionResult> => {
    const res = await reportsRepository.getPaymentPosition(filter)
    return res.ok ? { data: res.value, error: null } : { data: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
