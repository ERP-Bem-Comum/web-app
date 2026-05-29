'use client'

import { LabelList, Pie, PieChart as PieChartBase } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { ValueType } from 'recharts/types/component/DefaultTooltipContent'

interface GenericPieChartProps {
  data: Array<{ [key: string]: any }>
  chartConfig: ChartConfig
  dataKey: string
  nameKey: string
  valueFormatter?: (value: ValueType) => string
  mode?: 'label' | 'legend'
}

const GenericPieChart = ({
  data,
  chartConfig,
  dataKey,
  nameKey,
  valueFormatter,
  mode = 'label',
}: GenericPieChartProps) => {
  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[400px]">
      <PieChartBase>
        <ChartTooltip content={<ChartTooltipContent hideLabel valueFormatter={valueFormatter} />} />
        <Pie data={data} dataKey={dataKey} nameKey={nameKey}>
          {mode === 'label' && (
            <LabelList
              dataKey={nameKey}
              className="fill-background"
              stroke="none"
              fontSize={12}
              formatter={(value: keyof typeof chartConfig) => chartConfig[value]?.label}
            />
          )}
        </Pie>
        {mode === 'legend' && (
          <ChartLegend
            content={<ChartLegendContent nameKey={nameKey} />}
            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
          />
        )}
      </PieChartBase>
    </ChartContainer>
  )
}

export default GenericPieChart
