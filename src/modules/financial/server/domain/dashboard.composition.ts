/**
 * Composição PURA do Dashboard (domain, §II/§IV — sem I/O, sem `throw`). Transforma as agregações CRUAS
 * (`DashboardAggregations`, hoje placeholder / amanhã core-api#112) no `DashboardStatisticsDto` completo:
 *  - monta os 4 cards atribuindo layout (chaves i18n de rótulo/tendência + accent + icon);
 *  - monta a série do gráfico (yMax/yTicks/12 meses) a partir dos arrays mensais;
 *  - monta a distribuição do donut atribuindo os tons categóricos (c1..c4) por ordem/rank;
 *  - seleciona o TOP-N de fornecedores sem contrato (rank decrescente por valor).
 *
 * A FONTE dos números é a única coisa que muda ao ligar o #112 — esta composição (%/top-N/distribuição/
 * layout) permanece. Puro e determinístico (testável por node:test).
 */
import type {
  DashboardAggregations,
  DashboardChartSeries,
  DashboardDonutSlice,
  DashboardDonutTone,
  DashboardMetric,
  DashboardStatisticsDto,
  DashboardSupplier,
} from './dashboard.io.ts'

// ── Constantes de LAYOUT (composição, não fonte) ────────────────────────────────
/** Máximo do eixo Y (R$18M, escala em REAIS) — escala os pontos e desenha as gridlines. */
const CHART_Y_MAX = 18_000_000
/** Gridlines pontilhadas horizontais (R$4.5M/9M/13.5M/18M). */
const CHART_Y_TICKS: readonly number[] = [4_500_000, 9_000_000, 13_500_000, 18_000_000] as const
/** 12 meses no eixo X (Jan..Dez). */
const CHART_MONTHS = 12
/** Tons categóricos do donut, atribuídos por ordem da distribuição (cicla se houver > 4 centros). */
const DONUT_TONES: readonly DashboardDonutTone[] = ['c1', 'c2', 'c3', 'c4'] as const
/** Quantidade máxima de fornecedores sem contrato exibidos (TOP-N no card do Dashboard). */
const SUPPLIERS_TOP_N = 6
/**
 * Limite de DISPENSA de contrato: R$ 10.000,00 = 1.000.000 centavos (mesmo teto do relatório
 * "Fornecedores sem Contrato"). Acima dele o fornecedor DEVERIA ter contrato (estouro = danger).
 */
const DISPENSE_LIMIT_CENTS = 1_000_000

// Layout dos 4 cards (chaves i18n + accent semântico + ícone) — a ORDEM é a da linha 1.
const METRIC_LAYOUT = [
  {
    id: 'expenses',
    labelKey: 'dashboard.metric.expenses.label',
    trendLabelKey: 'dashboard.metric.expenses.trend',
    accent: 'red',
    icon: 'wallet',
    pick: (a: DashboardAggregations) => a.metrics.expenses,
  },
  {
    id: 'revenue',
    labelKey: 'dashboard.metric.revenue.label',
    trendLabelKey: 'dashboard.metric.revenue.trend',
    accent: 'green',
    icon: 'trending-up',
    pick: (a: DashboardAggregations) => a.metrics.revenue,
  },
  {
    id: 'top-financier',
    labelKey: 'dashboard.metric.top-financier.label',
    trendLabelKey: 'dashboard.metric.top-financier.trend',
    accent: 'indigo',
    icon: 'heart-handshake',
    pick: (a: DashboardAggregations) => a.metrics.topFinancier,
  },
  {
    id: 'top-cost-center',
    labelKey: 'dashboard.metric.top-cost-center.label',
    trendLabelKey: 'dashboard.metric.top-cost-center.trend',
    accent: 'orange',
    icon: 'users',
    pick: (a: DashboardAggregations) => a.metrics.topCostCenter,
  },
] as const

const buildMetrics = (agg: DashboardAggregations): readonly DashboardMetric[] =>
  METRIC_LAYOUT.map((m): DashboardMetric => {
    const raw = m.pick(agg)
    return {
      id: m.id,
      labelKey: m.labelKey,
      value: raw.value,
      trendPercent: raw.trendPercent,
      trendLabelKey: m.trendLabelKey,
      accent: m.accent,
      icon: m.icon,
    }
  })

const buildSeries = (
  id: DashboardChartSeries['id'],
  labelKey: string,
  monthly: readonly number[],
): DashboardChartSeries => ({
  id,
  labelKey,
  points: monthly.map((value, month) => ({ month, value })),
})

// Distribuição do donut: um tom por fatia (por ordem/rank; cicla mod 4 se houver > 4 centros).
const buildDistribution = (agg: DashboardAggregations): readonly DashboardDonutSlice[] =>
  agg.costCenters.map(
    (c, i): DashboardDonutSlice => ({
      id: c.id,
      labelKey: c.labelKey,
      valueCents: c.valueCents,
      tone: DONUT_TONES[i % DONUT_TONES.length] ?? 'c1',
    }),
  )

// TOP-N fornecedores sem contrato: rank DECRESCENTE por valor (sort estável); NÃO muta a entrada (§VII).
const buildSuppliers = (agg: DashboardAggregations): readonly DashboardSupplier[] =>
  [...agg.suppliersWithoutContract]
    .sort((a, b) => b.valorTotalCents - a.valorTotalCents)
    .slice(0, SUPPLIERS_TOP_N)
    .map((s): DashboardSupplier => ({ id: s.id, name: s.name, valorTotalCents: s.valorTotalCents }))

/** Agregações cruas → `DashboardStatisticsDto` completo. PURA (§II/§IV): sem I/O, sem `throw`, sem mutação. */
export function composeDashboardStatistics(agg: DashboardAggregations): DashboardStatisticsDto {
  return {
    metrics: buildMetrics(agg),
    chart: {
      months: CHART_MONTHS,
      yMax: CHART_Y_MAX,
      yTicks: CHART_Y_TICKS,
      series: [
        buildSeries('forecast', 'dashboard.chart.series.forecast', agg.monthlyForecast),
        buildSeries('realized', 'dashboard.chart.series.realized', agg.monthlyRealized),
      ],
    },
    costCenterDistribution: buildDistribution(agg),
    suppliersWithoutContract: buildSuppliers(agg),
    dispenseLimitCents: DISPENSE_LIMIT_CENTS,
  }
}
