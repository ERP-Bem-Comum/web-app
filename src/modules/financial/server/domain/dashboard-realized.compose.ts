/**
 * Composição PURA do gráfico "Realizado × Previsto" (domain, §II/§IV — sem I/O, sem `throw`, sem mutação
 * observável). Soma as séries dos planos (fan-out do "Todos somados"), converte centavos → REAIS e monta
 * o `DashboardChart` (mesma forma que a `LineChart` consome) com **eixo Y dinâmico** (o yMax fixo do
 * summary não serve p/ dado real). Determinístico → testável por node:test.
 */
import type { DashboardChart, DashboardChartSeries } from './dashboard.io.ts'
import type { RealizedPoint } from './dashboard-realized.io.ts'

const MONTHS = 12

/** Soma N séries (uma por plano) em 2 vetores de 12 meses (centavos). Índice = mês (0..11). */
export const sumRealizedSeries = (
  seriesPerPlan: readonly (readonly RealizedPoint[])[],
): Readonly<{ expectedCents: readonly number[]; realizedCents: readonly number[] }> => {
  const at = (series: readonly RealizedPoint[], month: number, pick: (p: RealizedPoint) => number): number =>
    series.reduce((acc, p) => (p.month === month ? acc + pick(p) : acc), 0)
  const expectedCents = Array.from({ length: MONTHS }, (_, m) =>
    seriesPerPlan.reduce((acc, s) => acc + at(s, m, (p) => p.expectedCents), 0),
  )
  const realizedCents = Array.from({ length: MONTHS }, (_, m) =>
    seriesPerPlan.reduce((acc, s) => acc + at(s, m, (p) => p.realizedCents), 0),
  )
  return { expectedCents, realizedCents }
}

/**
 * Eixo Y "bonito": `yMax` ≥ max das séries, arredondado p/ 1/2/5×10^n; 4 gridlines equiespaçadas. Sem
 * dado (max ≤ 0) → escala mínima default (evita divisão por zero na View e um gráfico degenerado).
 */
export const niceYAxis = (maxReais: number): Readonly<{ yMax: number; yTicks: readonly number[] }> => {
  if (!(maxReais > 0)) return { yMax: 1000, yTicks: [250, 500, 750, 1000] }
  const mag = 10 ** Math.floor(Math.log10(maxReais))
  const norm = maxReais / mag
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  const yMax = niceNorm * mag
  return { yMax, yTicks: [yMax / 4, yMax / 2, (yMax * 3) / 4, yMax] }
}

const centsToReais = (c: number): number => c / 100

/** Vetores mensais (centavos) → `DashboardChart` (REAIS, eixo dinâmico). */
export const composeRealizedChart = (
  expectedCents: readonly number[],
  realizedCents: readonly number[],
): DashboardChart => {
  const forecast = expectedCents.map(centsToReais)
  const realized = realizedCents.map(centsToReais)
  const max = Math.max(0, ...forecast, ...realized)
  const { yMax, yTicks } = niceYAxis(max)
  const series: readonly DashboardChartSeries[] = [
    {
      id: 'forecast',
      labelKey: 'dashboard.chart.series.forecast',
      points: forecast.map((value, month) => ({ month, value })),
    },
    {
      id: 'realized',
      labelKey: 'dashboard.chart.series.realized',
      points: realized.map((value, month) => ({ month, value })),
    },
  ]
  return { months: MONTHS, yMax, yTicks, series }
}

/** Chart vazio (sem plano aprovado): séries zeradas, escala mínima. */
export const emptyRealizedChart = (): DashboardChart =>
  composeRealizedChart(
    Array.from({ length: MONTHS }, () => 0),
    Array.from({ length: MONTHS }, () => 0),
  )
