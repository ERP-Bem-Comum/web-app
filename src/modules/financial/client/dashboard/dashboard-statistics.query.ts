/**
 * dashboardStatisticsQueryOptions — data AGNÓSTICA das estatísticas do Dashboard (052; sem React). A queryFn
 * devolve o `Result` MAPEADO (`{ data, error }`) p/ o binding ramificar loading/forbidden/error/ready — a
 * view-model fica pura. Sem input (o BFF compõe o DTO completo). Espelha `recent-payments.query.ts`.
 */
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { DashboardStatistics } from '#modules/financial/client/data/model/dashboard-statistics.model.ts'
import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

export type DashboardStatisticsResult = Readonly<{
  data: DashboardStatistics | null
  error: FinancialError | null
}>

export const dashboardStatisticsQueryKey = ['financial', 'dashboard-statistics'] as const

export const dashboardStatisticsQueryOptions = () => ({
  queryKey: dashboardStatisticsQueryKey,
  queryFn: async (): Promise<DashboardStatisticsResult> => {
    const res = await financialRepository.getDashboardStatistics()
    return res.ok ? { data: res.value, error: null } : { data: null, error: res.error }
  },
  staleTime: 60_000,
  retry: 1,
})
