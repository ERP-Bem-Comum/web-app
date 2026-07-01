/**
 * recentPaymentsQueryOptions — data AGNÓSTICA do widget "Últimos pagamentos" (042; sem React). A queryFn
 * devolve o `Result` MAPEADO (`{ items, error }`) para o binding ramificar loading/forbidden/error/empty/
 * data — a view-model fica pura. Espelha `contas-a-pagar.query.ts`. Sem input (Top-5 do backend).
 */
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { RecentPayment } from '#modules/financial/client/data/model/recent-payment.model.ts'
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

export type RecentPaymentsResult = Readonly<{
  items: readonly RecentPayment[]
  error: FinancialError | null
}>

export const recentPaymentsQueryKey = ['financial', 'recent-payments'] as const

export const recentPaymentsQueryOptions = () => ({
  queryKey: recentPaymentsQueryKey,
  queryFn: async (): Promise<RecentPaymentsResult> => {
    const res = await financialRepository.getRecentPayments()
    return res.ok ? { items: res.value, error: null } : { items: [], error: res.error }
  },
  staleTime: 30_000,
  retry: 1,
})
