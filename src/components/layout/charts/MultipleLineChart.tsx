'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { ValueType } from 'recharts/types/component/DefaultTooltipContent'

interface GenericLineChartProps<T> {
  data: T[]
  chartConfig: ChartConfig
  colors: { [key: string]: string }
  xAxisKey: keyof T
  yAxisKeys: (keyof T)[]
  formatXAxis?: (value: any) => string
  formatYAxis?: (value: any) => string
  valueFormatter?: (value: ValueType) => string
}

function GenericLineChart<T>({
  data,
  chartConfig,
  colors,
  xAxisKey,
  yAxisKeys,
  formatXAxis,
  formatYAxis,
  valueFormatter,
}: GenericLineChartProps<T>) {
  return (
    <ChartContainer config={chartConfig}>
      <LineChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#000" />
        <YAxis tickFormatter={formatYAxis} />
        <XAxis
          dataKey={xAxisKey as string}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatXAxis}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent valueFormatter={valueFormatter} />}
        />
        {yAxisKeys.map((key) => (
          <Line
            key={key as string}
            dataKey={key as string}
            type="linear"
            stroke={colors[key as string]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}

export default GenericLineChart
