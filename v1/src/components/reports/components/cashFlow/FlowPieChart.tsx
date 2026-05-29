'use client'

import GenericPieChart from '@/components/layout/charts/PieChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig } from '@/components/ui/chart'
import { COLOR_EXPECTED, COLOR_REALIZED } from '@/configurations/colors'
import { CashFlowSubData } from '@/types/reports/cashFlow'
import { maskMonetaryValue } from '@/utils/masks'
import { useMemo } from 'react'

const chartConfig: ChartConfig = {
  REALIZED: {
    label: 'Realizado',
    color: COLOR_REALIZED,
  },
  EXPECTED: {
    label: 'Previsto',
    color: COLOR_EXPECTED,
  },
  'Entradas Realizado': {
    label: 'Entradas Realizado',
    color: COLOR_REALIZED,
  },
  'Entradas Previsto': {
    label: 'Entradas Previsto',
    color: COLOR_EXPECTED,
  },
  'Saídas Realizado': {
    label: 'Saídas Realizado',
    color: COLOR_REALIZED,
  },
  'Saídas Previsto': {
    label: 'Saídas Previsto',
    color: COLOR_EXPECTED,
  },
}

interface FlowPieChartProps {
  Receivables?: CashFlowSubData[]
  Payables?: CashFlowSubData[]
}

function FlowPieChart({ Receivables, Payables }: FlowPieChartProps) {
  const pieDataReceivables = useMemo(() => {
    const totalReceivables = Receivables?.reduce(
      (acc, entry) => {
        acc.REALIZED += entry.REALIZED
        acc.EXPECTED += entry.EXPECTED
        return acc
      },
      { REALIZED: 0, EXPECTED: 0 },
    )

    return [
      { name: 'Entradas Realizado', value: totalReceivables?.REALIZED ?? 0, fill: COLOR_REALIZED },
      { name: 'Entradas Previsto', value: totalReceivables?.EXPECTED ?? 0, fill: COLOR_EXPECTED },
    ]
  }, [Receivables])

  const pieDataPayables = useMemo(() => {
    const totalPayables = Payables?.reduce(
      (acc, entry) => {
        acc.REALIZED -= entry.REALIZED
        acc.EXPECTED -= entry.EXPECTED
        return acc
      },
      { REALIZED: 0, EXPECTED: 0 },
    )

    return [
      { name: 'Saídas Realizado', value: totalPayables?.REALIZED ?? 0, fill: COLOR_REALIZED },
      { name: 'Saídas Previsto', value: totalPayables?.EXPECTED ?? 0, fill: COLOR_EXPECTED },
    ]
  }, [Payables])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Entradas</CardTitle>
          <CardDescription>Previsto vs Realizado</CardDescription>
        </CardHeader>
        <CardContent>
          <GenericPieChart
            data={pieDataReceivables}
            chartConfig={chartConfig}
            dataKey="value"
            nameKey="name"
            valueFormatter={(value) => maskMonetaryValue(value as number)}
            mode="legend"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Saídas</CardTitle>
          <CardDescription>Previsto vs Realizado</CardDescription>
        </CardHeader>
        <CardContent>
          <GenericPieChart
            data={pieDataPayables}
            chartConfig={chartConfig}
            dataKey="value"
            nameKey="name"
            valueFormatter={(value) => maskMonetaryValue(value as number)}
            mode="legend"
          />
        </CardContent>
      </Card>
    </>
  )
}

export default FlowPieChart
