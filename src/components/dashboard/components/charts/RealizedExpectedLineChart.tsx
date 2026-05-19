'use client'

import GenericLineChart from '@/components/layout/charts/MultipleLineChart'
import { ChartConfig } from '@/components/ui/chart'
import { DashboardStatistics } from '@/types/statistics'
import { COLOR_EXPECTED, COLOR_REALIZED } from '../../../../configurations/colors'
import { maskMonetaryValue } from '@/utils/masks'

const chartConfig: ChartConfig = {
  expected: {
    label: 'Previsto',
    color: COLOR_EXPECTED,
  },
  realized: {
    label: 'Realizado',
    color: COLOR_REALIZED,
  },
}

const colors = {
  expected: COLOR_EXPECTED,
  realized: COLOR_REALIZED,
}

const formatYAxis = (value: number) => {
  if (value >= 1000 && value < 1000000) {
    return `R$${value / 1000}k`
  } else if (value >= 1000000) {
    return `R$${value / 1000000}M`
  }
  return `R$${value}`
}

const formatXAxis = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1, 3)
}

interface RealizedExpectedLineChartProps {
  data: DashboardStatistics['chartRealized']
}

function RealizedExpectedLineChart({ data }: RealizedExpectedLineChartProps) {
  return (
    <GenericLineChart
      data={data}
      chartConfig={chartConfig}
      colors={colors}
      xAxisKey="month"
      yAxisKeys={['expected', 'realized']}
      formatXAxis={formatXAxis}
      formatYAxis={formatYAxis}
      valueFormatter={(value) => maskMonetaryValue(value as number)}
    />
  )
}

export default RealizedExpectedLineChart
