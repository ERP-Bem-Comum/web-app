/**
 * dashboard-content (vitest/jsdom) — view BURRA do corpo do Dashboard (052). Recebe o `DashboardStatistics`
 * (DTO composto pelo BFF) + o `RecentPaymentsView` por props e renderiza os 4 cards + os 2 gráficos (linha e
 * donut) + o card de fornecedores, tudo a partir do DTO (sem rede). Confirma a nova ORIGEM (server-state) sem
 * regressão: os rótulos i18n dos cards, os gráficos (role="img") e o nome de um fornecedor.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { DashboardContent } from '#modules/financial/client/dashboard/page/dashboard-content.component.tsx'
import type { DashboardStatistics } from '#modules/financial/client/data/model/dashboard-statistics.model.ts'
import type { RecentPaymentsView } from '#modules/financial/client/dashboard/recent-payments.binding.ts'
import type { DashboardRealizedView } from '#modules/financial/client/dashboard/dashboard-realized.binding.ts'

afterEach(() => {
  cleanup()
})

const STATS: DashboardStatistics = {
  metrics: [
    {
      id: 'expenses',
      labelKey: 'dashboard.metric.expenses.label',
      value: 'R$ 1.234,00',
      trendPercent: '0%',
      trendLabelKey: 'dashboard.metric.expenses.trend',
      accent: 'red',
      icon: 'wallet',
    },
    {
      id: 'revenue',
      labelKey: 'dashboard.metric.revenue.label',
      value: 'R$ 0,00',
      trendPercent: '0%',
      trendLabelKey: 'dashboard.metric.revenue.trend',
      accent: 'green',
      icon: 'trending-up',
    },
    {
      id: 'top-financier',
      labelKey: 'dashboard.metric.top-financier.label',
      value: '0%',
      trendPercent: '0%',
      trendLabelKey: 'dashboard.metric.top-financier.trend',
      accent: 'indigo',
      icon: 'heart-handshake',
    },
    {
      id: 'top-cost-center',
      labelKey: 'dashboard.metric.top-cost-center.label',
      value: 'R$ 0,00',
      trendPercent: '0%',
      trendLabelKey: 'dashboard.metric.top-cost-center.trend',
      accent: 'orange',
      icon: 'users',
    },
  ],
  chart: {
    months: 12,
    yMax: 18_000_000,
    yTicks: [4_500_000, 9_000_000, 13_500_000, 18_000_000],
    series: [
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
    ],
  },
  costCenterDistribution: [
    { id: 'strategic', labelKey: 'dashboard.cost-center.slice.strategic', valueCents: 4_500_000, tone: 'c1' },
    { id: 'logistics', labelKey: 'dashboard.cost-center.slice.logistics', valueCents: 3_200_000, tone: 'c2' },
  ],
  suppliersWithoutContract: [
    { id: 'wee-travel', name: 'WEE TRAVEL', valorTotalCents: 1_298_185 },
    { id: 'polo-moveis', name: 'POLO MOVEIS', valorTotalCents: 742_000 },
  ],
  dispenseLimitCents: 1_000_000,
}

const RECENT: RecentPaymentsView = { status: 'empty', rows: [] }

// P3: gráfico Realizado × Previsto pronto (reusa a série do STATS só p/ ter um chart válido).
const REALIZED: DashboardRealizedView = {
  status: 'ready',
  chart: STATS.chart,
  options: [{ value: 'all', label: 'dashboard.realized.all', translate: true }],
  selectedValue: 'all',
  onSelect: () => undefined,
}

describe('DashboardContent', () => {
  it('renderiza os 4 cards de métrica (rótulos i18n) a partir do DTO', () => {
    render(
      <DashboardContent
        data={STATS}
        recent={RECENT}
        realized={REALIZED}
        animate={false}
        onSeeAllOverview={() => undefined}
        onSeeAllSuppliers={() => undefined}
      />,
    )
    expect(screen.getByText('Gastos')).toBeTruthy()
    expect(screen.getByText('Arrecadação')).toBeTruthy()
    expect(screen.getByText('Top Financiador')).toBeTruthy()
    expect(screen.getByText('Top Centro de Custo')).toBeTruthy()
    // valor do card vem do DTO
    expect(screen.getByText('R$ 1.234,00')).toBeTruthy()
  })

  it('renderiza os 2 gráficos (linha + donut) como role="img" a partir do DTO', () => {
    render(
      <DashboardContent
        data={STATS}
        recent={RECENT}
        realized={REALIZED}
        animate={false}
        onSeeAllOverview={() => undefined}
        onSeeAllSuppliers={() => undefined}
      />,
    )
    // LineChart + DonutChart → 2 svg role="img"
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(2)
    // legenda do donut resolve os labelKeys das fatias
    expect(screen.getByText('Consultoria Estratégica')).toBeTruthy()
    expect(screen.getByText('Logística')).toBeTruthy()
  })

  it('renderiza as barras de fornecedores sem contrato derivadas do DTO', () => {
    render(
      <DashboardContent
        data={STATS}
        recent={RECENT}
        realized={REALIZED}
        animate={false}
        onSeeAllOverview={() => undefined}
        onSeeAllSuppliers={() => undefined}
      />,
    )
    expect(screen.getByText('WEE TRAVEL')).toBeTruthy()
    expect(screen.getByText('POLO MOVEIS')).toBeTruthy()
    // % utilizado formatado (1.298.185 / 1.000.000 → 129,82%)
    expect(screen.getByText('129,82%')).toBeTruthy()
  })

  it('"Ver tudo" da Visão geral e "Ver todas" dos Fornecedores acionam os callbacks certos', () => {
    const onSeeAllOverview = vi.fn()
    const onSeeAllSuppliers = vi.fn()
    render(
      <DashboardContent
        data={STATS}
        recent={RECENT}
        realized={REALIZED}
        animate={false}
        onSeeAllOverview={onSeeAllOverview}
        onSeeAllSuppliers={onSeeAllSuppliers}
      />,
    )
    fireEvent.click(screen.getByText('Ver tudo')) // Visão geral (Previsto × Realizado)
    expect(onSeeAllOverview).toHaveBeenCalledTimes(1)
    expect(onSeeAllSuppliers).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Ver todas')) // Fornecedores sem contrato
    expect(onSeeAllSuppliers).toHaveBeenCalledTimes(1)
    expect(onSeeAllOverview).toHaveBeenCalledTimes(1)
  })
})
