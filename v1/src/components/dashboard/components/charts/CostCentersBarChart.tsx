'use client'

import GenericBarChart from '@/components/layout/charts/BarChart'
import { ChartConfig } from '@/components/ui/chart'
import { COLOR_EXPECTED } from '../../../../configurations/colors'

const chartConfig: ChartConfig = {
  percentage: {
    label: '% =',
    color: 'hsl(var(--chart-1))',
  },
}

interface CostCentersBarChartProps {
  data: { name: string; percentage: number }[]
}

function CostCentersBarChart({ data }: CostCentersBarChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}
      >
        <p>Sem gastos no mês anterior</p>
      </div>
    )
  }

  return (
    <GenericBarChart
      className="m-auto max-h-[500px]"
      data={data}
      chartConfig={chartConfig}
      barColor={COLOR_EXPECTED}
      dataKey="percentage"
      nameKey="name"
    />
  )
}

export default CostCentersBarChart
