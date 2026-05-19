'use client'

import { Label, LabelList, Pie, PieChart as PieChartBase } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { ValueType } from 'recharts/types/component/DefaultTooltipContent'

interface PieChartDonutProps {
  data: Array<{ [key: string]: any }>
  chartConfig: ChartConfig
  dataKey: string
  nameKey: string
  valueFormatter: (value: ValueType) => string
  total: number
  totalLabel: string
}

const PieChartDonut = ({
  data,
  chartConfig,
  dataKey,
  nameKey,
  valueFormatter,
  total,
  totalLabel,
}: PieChartDonutProps) => {
  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[400px]">
      <PieChartBase>
        <ChartTooltip content={<ChartTooltipContent hideLabel valueFormatter={valueFormatter} />} />
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius={90} strokeWidth={5}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-lg font-bold"
                    >
                      {valueFormatter(total)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      {totalLabel}
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey={nameKey} />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChartBase>
    </ChartContainer>
  )
}

export default PieChartDonut
