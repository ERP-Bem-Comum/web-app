/**
 * Binding das estatísticas do Dashboard (052) — ADAPTER React (ADR-0009: React SÓ aqui). Lê a query do BFF
 * (`dashboardStatisticsQueryOptions`) e entrega ao page uma união discriminada `{ status, data }` (§IV):
 * loading | forbidden | error | ready. A page ramifica os estados; a View permanece burra. A cadeia de erro
 * (§V) chega como VALOR (`FinancialError`) — a UI nunca olha status HTTP.
 */
import { useQuery } from '@tanstack/react-query'

import type { DashboardStatistics } from '#modules/financial/client/data/model/dashboard-statistics.model.ts'

import { dashboardStatisticsQueryOptions } from './dashboard-statistics.query.ts'

export type DashboardStatisticsStatus = 'loading' | 'forbidden' | 'error' | 'ready'

export type DashboardStatisticsView = Readonly<{
  status: DashboardStatisticsStatus
  data: DashboardStatistics | null
}>

export function useDashboardStatistics(): DashboardStatisticsView {
  const q = useQuery(dashboardStatisticsQueryOptions())

  const status: DashboardStatisticsStatus = (() => {
    if (q.isLoading || q.data === undefined) return 'loading'
    if (q.data.error === 'forbidden' || q.data.error === 'unauthorized') return 'forbidden'
    if (q.data.error !== null || q.data.data === null) return 'error'
    return 'ready'
  })()

  return { status, data: status === 'ready' ? (q.data?.data ?? null) : null }
}
