import React from 'react'
import GenericPieChart from '@/components/layout/charts/PieChart'
import { CollaboratorData, GenderIdentity } from '@/types/reports/team'
import { ChartConfig } from '@/components/ui/chart'
import { genderList } from '@/utils/enums'

interface GenderChartProps {
  data: CollaboratorData[]
}

const genderColors: Record<string, string> = {
  'N/A': '#6d6565',
  'Prefiro não responder': '#A9A9A9',
  'Homem Cis': '#1E90FF',
  'Homem Trans': '#00BFFF',
  'Mulher Cis': '#FF69B4',
  'Mulher Trans': '#FF1493',
  Travesti: '#8A2BE2',
  'Não Binário': '#FFD700',
  Outro: '#7FFF00',
}

const GenderChart = ({ data }: GenderChartProps) => {
  const transformGenderData = (data: CollaboratorData[]) => {
    const genderData = data.reduce(
      (acc, curr) => {
        if (curr?.genderIdentity === null) {
          return acc
        }
        const gender = genderList[curr.genderIdentity] || 'N/A'
        acc[gender] = (acc[gender] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(genderData).map(([name, value]) => ({
      name,
      value,
      fill: genderColors[name],
    }))
  }

  const genderChartData = transformGenderData(data)

  const chartConfig = {
    value: {
      label: 'Quantidade',
    },
    ...Object.keys(genderColors).reduce((acc, key) => {
      acc[key] = { label: key, color: genderColors[key] }
      return acc
    }, {} as ChartConfig),
  }

  return (
    <GenericPieChart
      chartConfig={chartConfig}
      data={genderChartData}
      nameKey="name"
      dataKey="value"
    />
  )
}

export default GenderChart
