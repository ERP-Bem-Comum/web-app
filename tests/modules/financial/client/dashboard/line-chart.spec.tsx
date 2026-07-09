/**
 * line-chart (vitest/jsdom) — view BURRA do gráfico de linha (043) em SVG nativo. Recebe séries, yMax,
 * yTicks, meses e rótulos por props e desenha um role="img" com uma <polyline> por série + rótulos de
 * mês. Usa as constantes do view-model como dados; `seriesLabel` resolve a key da série.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { LineChart } from '#modules/financial/client/dashboard/components/line-chart.component.tsx'
import type { ChartSeries } from '#modules/financial/client/dashboard/dashboard-summary.view-model.ts'

afterEach(() => {
  cleanup()
})

// Fixture local (as constantes de dados saíram do view-model → agora vêm do DTO do BFF). 2 séries × 12 meses.
const CHART_MONTHS = 12
const CHART_Y_MAX = 18_000_000
const CHART_Y_TICKS: readonly number[] = [4_500_000, 9_000_000, 13_500_000, 18_000_000]
const CHART_SERIES: readonly ChartSeries[] = [
  {
    id: 'forecast',
    labelKey: 'dashboard.chart.series.forecast',
    points: Array.from({ length: 12 }, (_, m) => ({ month: m, value: (m + 1) * 1_000_000 })),
  },
  {
    id: 'realized',
    labelKey: 'dashboard.chart.series.realized',
    points: Array.from({ length: 12 }, (_, m) => ({ month: m, value: (m + 1) * 800_000 })),
  },
]

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const

const seriesLabel = (s: ChartSeries): string => s.labelKey

describe('LineChart', () => {
  it('renderiza um role="img" e uma linha <path> suave por série', () => {
    const { container } = render(
      <LineChart
        series={CHART_SERIES}
        yMax={CHART_Y_MAX}
        yTicks={CHART_Y_TICKS}
        months={CHART_MONTHS}
        monthLabels={MONTH_LABELS}
        seriesLabel={seriesLabel}
      />,
    )
    expect(screen.getByRole('img')).toBeTruthy()
    // Linha SUAVE por série (fill="none"); as áreas com gradiente são <path> com fill=url(...) — não contam.
    const linePaths = container.querySelectorAll('path[fill="none"]')
    expect(linePaths).toHaveLength(CHART_SERIES.length)
    // Uma área com gradiente por série (fill via url(#dashAreaFill-...)).
    const areaPaths = container.querySelectorAll('path[fill^="url(#dashAreaFill"]')
    expect(areaPaths).toHaveLength(CHART_SERIES.length)
  })

  it('mostra os rótulos de mês passados (Jan..Dez)', () => {
    render(
      <LineChart
        series={CHART_SERIES}
        yMax={CHART_Y_MAX}
        yTicks={CHART_Y_TICKS}
        months={CHART_MONTHS}
        monthLabels={MONTH_LABELS}
        seriesLabel={seriesLabel}
      />,
    )
    expect(screen.getByText('Jan')).toBeTruthy()
    expect(screen.getByText('Fev')).toBeTruthy()
    expect(screen.getByText('Dez')).toBeTruthy()
  })
})
