import React from 'react'
import GenericLineChart from '@/components/layout/charts/MultipleLineChart'
import { CollaboratorData } from '@/types/reports/team'

interface YearChartProps {
  data: CollaboratorData[]
}

const YearChart = ({ data }: YearChartProps) => {
  const transformYearData = (data: CollaboratorData[]) => {
    const yearData = data.reduce(
      (acc, curr) => {
        const year = new Date(curr.startOfContract).getFullYear()
        acc[year] = (acc[year] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )

    return Object.entries(yearData).map(([name, value]) => ({
      name: name.toString(),
      value,
    }))
  }

  const yearChartData = transformYearData(data)

  return (
    <GenericLineChart
      data={yearChartData}
      chartConfig={{
        value: {
          label: 'Quantidade',
        },
      }}
      colors={{ value: '#32C6F4' }}
      xAxisKey="name"
      yAxisKeys={['value']}
    />
  )
}

export default YearChart
