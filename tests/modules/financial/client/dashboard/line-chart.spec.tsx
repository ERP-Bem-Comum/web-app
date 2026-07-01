/**
 * line-chart (vitest/jsdom) — view BURRA do gráfico de linha (043) em SVG nativo. Recebe séries, yMax,
 * yTicks, meses e rótulos por props e desenha um role="img" com uma <polyline> por série + rótulos de
 * mês. Usa as constantes do view-model como dados; `seriesLabel` resolve a key da série.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { LineChart } from '#modules/financial/client/dashboard/components/line-chart.component.tsx'
import {
  CHART_SERIES,
  CHART_Y_MAX,
  CHART_Y_TICKS,
  CHART_MONTHS,
  type ChartSeries,
} from '#modules/financial/client/dashboard/dashboard-summary.view-model.ts'

afterEach(() => {
  cleanup()
})

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
    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(CHART_SERIES.length)
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
