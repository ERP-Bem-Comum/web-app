'use client'

import { TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { maskMonetaryValue } from '@/utils/masks'
import { CashFlowSubData, ChartCostCenter } from '@/types/reports/cashFlow'
import { useMemo } from 'react'
import { COLOR_EXPECTED } from '@/configurations/colors'

const chartConfig: ChartConfig = {
  EXPECTED: {
    label: 'Previsto',
  },
  REALIZED: {
    label: 'Realizado',
  },
}

interface FlowCostCentersBarChartProps {
  Receivables?: CashFlowSubData[]
  Payables?: CashFlowSubData[]
}

function FlowCostCentersBarChart({ Receivables, Payables }: FlowCostCentersBarChartProps) {
  const costCenterData: ChartCostCenter[] = useMemo(() => {
    const combinedData = [...(Receivables ?? []), ...(Payables ?? [])]
    const costCenterMap: { [key: string]: ChartCostCenter } = {}

    combinedData.forEach((entry) => {
      if (!costCenterMap[entry.SubCategory_name]) {
        costCenterMap[entry.SubCategory_name] = {
          CostCenter_name: entry.SubCategory_name,
          REALIZED: 0,
          EXPECTED: 0,
        }
      }
      costCenterMap[entry.SubCategory_name].REALIZED += entry.REALIZED
      costCenterMap[entry.SubCategory_name].EXPECTED += entry.EXPECTED
    })

    return Object.values(costCenterMap)
  }, [Receivables, Payables])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agrupado por Centro de Custo</CardTitle>
        <CardDescription>Previsto vs Realizado</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={costCenterData}
            margin={{ top: 40, right: 0, left: 50, bottom: 40 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="CostCenter_name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.split(' ')[0] || 'Não classificado'}
            />
            <YAxis tickFormatter={maskMonetaryValue} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  valueFormatter={(value) => maskMonetaryValue(value as number)}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="EXPECTED"
              stackId="EXPECTED"
              fill={COLOR_EXPECTED}
              radius={[0, 0, 4, 4]}
            />
            <Bar dataKey="REALIZED" stackId="REALIZED" fill="#8DDA74" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default FlowCostCentersBarChart
