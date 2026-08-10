/**
 * dashboard-summary.view-model — NÚCLEO PURO (ADR-0009, §XI): sem import de react/@tanstack. Deriva o
 * `DashboardStatistics` (server-state, composto pelo BFF — 052/#352) → props das views burras. NÃO holda
 * mais dados hardcoded: a FONTE (placeholder até core-api#112) e a composição vivem no server; aqui só se
 * mapeia o DTO para as formas que os componentes consomem.
 *
 * Os TIPOS que as views/specs importam continuam expostos aqui (nomes estáveis), aliasados ao model. A cor
 * concreta (token vanilla-extract) é escolhida na VIEW a partir do `accent`/`tone` semântico (§X).
 */
import type {
  DashboardStatistics,
  DashboardMetric,
  DashboardMetricAccent,
  DashboardMetricIcon,
  DashboardChartSeries,
  DashboardChartSeriesId,
  DashboardChartPoint,
  DashboardDonutTone,
} from '#modules/financial/client/data/model/dashboard-statistics.model.ts'

// Re-export do DTO p/ as views burras (client-ui): elas consomem o tipo pela ViewModel (§XI), não pela data.
export type { DashboardStatistics } from '#modules/financial/client/data/model/dashboard-statistics.model.ts'

// ── Tipos que as views/specs consomem (nomes estáveis; aliasados ao model) ──────
export type MetricAccent = DashboardMetricAccent
export type MetricIconName = DashboardMetricIcon
export type MetricCardData = DashboardMetric
export type ChartSeriesId = DashboardChartSeriesId
export type ChartPoint = DashboardChartPoint
export type ChartSeries = DashboardChartSeries
export type DonutTone = DashboardDonutTone

/**
 * Fatia do donut (component-facing): rótulo (i18n) + `value` (CENTAVOS — o donut calcula a % pela fração
 * do total) + tom categórico da cor. Deriva do `valueCents` do DTO.
 */
export type DonutSlice = Readonly<{
  id: string
  labelKey: string
  value: number
  tone: DonutTone
}>

/** Fornecedor sem contrato (linha de origem do card). `valorTotalCents` = total pago SEM contrato (§IV). */
export type SupplierWithoutContract = Readonly<{ id: string; name: string; valorTotalCents: number }>

/** Status de compliance de um fornecedor perante o limite de dispensa (dirige a cor da barra). */
export type SupplierComplianceStatus = 'over' | 'at' | 'within'

/**
 * Barra de compliance JÁ derivada (pura): nome + total (centavos) + % utilizado BRUTA (pode passar de 100,
 * usada p/ a LARGURA proporcional) + status (cor). A View não calcula nada — só apresenta.
 */
export type SupplierComplianceBar = Readonly<{
  id: string
  name: string
  valorTotalCents: number
  /** % utilizado do limite (valorTotal / limite * 100). Pode passar de 100. */
  utilizadoPct: number
  status: SupplierComplianceStatus
}>

// ── Derivações PURAS do DTO → props das views ───────────────────────────────────

/** Métricas do DTO → cards (já no shape do MetricCard). */
export const toMetricCards = (stats: DashboardStatistics): readonly MetricCardData[] => stats.metrics

/** Série do gráfico do DTO → props do LineChart. */
export const toChartSeries = (stats: DashboardStatistics): readonly ChartSeries[] => stats.chart.series

/** Distribuição do DTO → fatias do donut (mapeia `valueCents` → `value`). */
export const toDonutSlices = (stats: DashboardStatistics): readonly DonutSlice[] =>
  stats.costCenterDistribution.map(
    (s): DonutSlice => ({ id: s.id, labelKey: s.labelKey, value: s.valueCents, tone: s.tone }),
  )

/**
 * Deriva (PURO, §XI) a barra de compliance de cada fornecedor perante `limiteCents`: % utilizado + status
 * (over > limite; at == limite; within < limite — comparação ESTRITA: 100% exato NÃO estoura). Ordena
 * DECRESCENTE por `valorTotalCents` (top ofensores primeiro; sort estável do V8 preserva empates). NÃO muta
 * a entrada (copia antes de ordenar §VII). Fonte ÚNICA de verdade da cor/ordenação das barras.
 */
export function deriveSupplierComplianceBars(
  suppliers: readonly SupplierWithoutContract[],
  limiteCents: number,
): readonly SupplierComplianceBar[] {
  return [...suppliers]
    .sort((a, b) => b.valorTotalCents - a.valorTotalCents)
    .map((s) => {
      const status: SupplierComplianceStatus =
        s.valorTotalCents > limiteCents ? 'over' : s.valorTotalCents === limiteCents ? 'at' : 'within'
      return {
        id: s.id,
        name: s.name,
        valorTotalCents: s.valorTotalCents,
        utilizadoPct: limiteCents === 0 ? 0 : (s.valorTotalCents / limiteCents) * 100,
        status,
      }
    })
}

const brlFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Centavos → "R$ 12.981,85" (valor do fornecedor no card/tooltip). */
export function formatSupplierBRL(cents: number): string {
  return brlFmt.format(cents / 100)
}

/**
 * Percentual utilizado no formato do relatório: 2 dígitos INTEIROS zero-padded + vírgula + 2 decimais + "%".
 * Ex.: 129.82 → "129,82%"; 12.8 → "12,80%". A parte inteira só zero-pada até 2 dígitos; ≥ 100 mantém tudo.
 */
export function formatSupplierPercent(pct: number): string {
  const fixed = pct.toFixed(2)
  const [intPart = '0', decPart = '00'] = fixed.split('.')
  return `${intPart.padStart(2, '0')},${decPart}%`
}
