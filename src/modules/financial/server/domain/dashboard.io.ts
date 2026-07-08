/**
 * Dashboard "Resumo Mensal" — tipos de I/O do domínio (PUROS, sem Zod — §VI). O BFF compõe o
 * `DashboardStatisticsDto` COMPLETO por caso de uso (§III, ADR-0010/0049): 4 métricas, série do gráfico
 * (Previsto × Realizado), distribuição por centro de custo (donut) e fornecedores sem contrato. A UI
 * consome o DTO como server-state; a composição (%/top-N/distribuição/layout) vive em `dashboard.composition.ts`.
 *
 * `DashboardAggregations` = a forma CRUA (SUM/GROUP-BY/TOP-N) que o **core-api#112** entregará; hoje vem de
 * uma FONTE placeholder isolada (`../adapters/dashboard-statistics.placeholder-source.ts`). Ao ligar o #112,
 * troca-se SÓ a fonte — a composição permanece. O schema Zod da agregação crua vive na borda
 * (`../adapters/core-api/dashboard.schema.ts`), nunca aqui (§IX).
 */

// ── DTO composto (o que a tela consome) ─────────────────────────────────────────

// Accent semântico do ícone circular de cada métrica (a View mapeia p/ token de cor, §X).
export type DashboardMetricAccent = 'red' | 'green' | 'indigo' | 'orange'
// Ícone semântico de cada métrica (a View mapeia p/ o componente de ícone).
export type DashboardMetricIcon = 'wallet' | 'trending-up' | 'heart-handshake' | 'users'

export type DashboardMetric = Readonly<{
  id: string
  /** chave i18n do rótulo pequeno (topo do card) */
  labelKey: string
  /** valor grande, já formatado p/ apresentação (INTERINO: placeholder zerado) */
  value: string
  /** percentual de tendência, já formatado (INTERINO) */
  trendPercent: string
  /** chave i18n da legenda da tendência (após o "·") */
  trendLabelKey: string
  accent: DashboardMetricAccent
  icon: DashboardMetricIcon
}>

// Papel da série no gráfico de linha (a View mapeia p/ token de cor).
export type DashboardChartSeriesId = 'forecast' | 'realized'
/** Ponto do gráfico: mês (0..11) → valor em REAIS (escala de milhões, fiel ao eixo R$M do legado). */
export type DashboardChartPoint = Readonly<{ month: number; value: number }>
export type DashboardChartSeries = Readonly<{
  id: DashboardChartSeriesId
  /** chave i18n do nome da série (legenda) */
  labelKey: string
  points: readonly DashboardChartPoint[]
}>
export type DashboardChart = Readonly<{
  /** meses no eixo X (12) */
  months: number
  /** máximo do eixo Y (R$18M) — escala em REAIS */
  yMax: number
  /** gridlines pontilhadas horizontais (R$4.5M/9M/13.5M/18M) */
  yTicks: readonly number[]
  series: readonly DashboardChartSeries[]
}>

// Tom categórico do donut (paleta dedicada `dash.*`, sem o vermelho de erro). c1=azul · c2=ciano ·
// c3=verde-azulado · c4=âmbar.
export type DashboardDonutTone = 'c1' | 'c2' | 'c3' | 'c4'
/** Fatia do donut: rótulo (i18n) + valor em CENTAVOS + tom categórico da cor. */
export type DashboardDonutSlice = Readonly<{
  id: string
  labelKey: string
  valueCents: number
  tone: DashboardDonutTone
}>

/** Fornecedor sem contrato: nome + total pago SEM contrato (centavos inteiros, §IV). */
export type DashboardSupplier = Readonly<{
  id: string
  name: string
  valorTotalCents: number
}>

/** DTO COMPLETO do Dashboard — a resposta pronta por caso de uso que a server fn entrega. */
export type DashboardStatisticsDto = Readonly<{
  metrics: readonly DashboardMetric[]
  chart: DashboardChart
  costCenterDistribution: readonly DashboardDonutSlice[]
  suppliersWithoutContract: readonly DashboardSupplier[]
  /** Limite de DISPENSA de contrato (centavos) — dirige a cor das barras de compliance na View. */
  dispenseLimitCents: number
}>

// ── Agregações CRUAS (INTERINO — a forma do core-api#112) ───────────────────────

/** Valor cru de uma métrica (INTERINO: string já formatada enquanto zerada; vira número com o #112). */
export type RawMetricAggregation = Readonly<{ value: string; trendPercent: string }>

/**
 * Agregações CRUAS do Dashboard — SUM/GROUP-BY/TOP-N que o core-api#112 entregará. HOJE vêm da fonte
 * placeholder; a composição pura as transforma no `DashboardStatisticsDto`. Ao ligar o #112 troca-se
 * SÓ a fonte (esta forma é o contrato). Ordem das listas é significativa (rank do TOP-N / ordem do donut).
 */
export type DashboardAggregations = Readonly<{
  metrics: Readonly<{
    expenses: RawMetricAggregation
    revenue: RawMetricAggregation
    topFinancier: RawMetricAggregation
    topCostCenter: RawMetricAggregation
  }>
  /** série mensal PREVISTA (12 valores em REAIS, Jan..Dez) */
  monthlyForecast: readonly number[]
  /** série mensal REALIZADA (12 valores em REAIS, Jan..Dez) */
  monthlyRealized: readonly number[]
  /** distribuição por centro de custo (group-by): rótulo i18n + total em centavos, já rankeada */
  costCenters: readonly Readonly<{ id: string; labelKey: string; valueCents: number }>[]
  /** fornecedores sem contrato (top-N cru): id/nome/total pago em centavos */
  suppliersWithoutContract: readonly Readonly<{ id: string; name: string; valorTotalCents: number }>[]
}>
