/**
 * DashboardStatistics — model do client p/ o Dashboard "Resumo Mensal" (052). Espelha o
 * `DashboardStatisticsDto` do server (`dashboard.io.ts`): o BFF compõe; o client só consome (server-state).
 * Money em CENTAVOS (donut/fornecedores); a série do gráfico em REAIS (escala do eixo legado). Arquivo
 * NEUTRO da camada `client/data` (boundary §I). Espelha `recent-payment.model.ts`.
 */

export type DashboardMetricAccent = 'red' | 'green' | 'indigo' | 'orange'
export type DashboardMetricIcon = 'wallet' | 'trending-up' | 'heart-handshake' | 'users'

export type DashboardMetric = Readonly<{
  id: string
  labelKey: string
  value: string
  trendPercent: string
  trendLabelKey: string
  accent: DashboardMetricAccent
  icon: DashboardMetricIcon
}>

export type DashboardChartSeriesId = 'forecast' | 'realized'
export type DashboardChartPoint = Readonly<{ month: number; value: number }>
export type DashboardChartSeries = Readonly<{
  id: DashboardChartSeriesId
  labelKey: string
  points: readonly DashboardChartPoint[]
}>
export type DashboardChart = Readonly<{
  months: number
  yMax: number
  yTicks: readonly number[]
  series: readonly DashboardChartSeries[]
}>

export type DashboardDonutTone = 'c1' | 'c2' | 'c3' | 'c4'
export type DashboardDonutSlice = Readonly<{
  id: string
  labelKey: string
  valueCents: number
  tone: DashboardDonutTone
}>

export type DashboardSupplier = Readonly<{
  id: string
  name: string
  valorTotalCents: number
}>

export type DashboardStatistics = Readonly<{
  metrics: readonly DashboardMetric[]
  chart: DashboardChart
  costCenterDistribution: readonly DashboardDonutSlice[]
  suppliersWithoutContract: readonly DashboardSupplier[]
  dispenseLimitCents: number
}>
