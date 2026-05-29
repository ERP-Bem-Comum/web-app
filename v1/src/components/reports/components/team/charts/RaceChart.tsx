import React from 'react'
import GenericBarChart from '@/components/layout/charts/BarChart'
import { CollaboratorData } from '@/types/reports/team'
import { raceList } from '@/utils/enums'
import { ChartConfig } from '@/components/ui/chart'

interface RaceChartProps {
  data: CollaboratorData[]
}

const raceColors: Record<string, string> = {
  Amarelo: '#FFDDC1',
  Branco: '#C0C0C0',
  Pardo: '#D2B48C',
  Indígena: '#8B4513',
  Preto: '#000000',
  'Prefiro não revelar': '#808080',
  'N/A': '#b7a9a9',
}

const RaceChart = ({ data }: RaceChartProps) => {
  const transformRaceData = (data: CollaboratorData[]) => {
    const raceData = data.reduce(
      (acc, curr) => {
        const race = raceList[curr.race as keyof typeof raceList] || 'N/A'
        acc[race] = (acc[race] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(raceData).map(([name, value]) => ({
      name,
      value,
      fill: raceColors[name],
    }))
  }

  const raceChartData = transformRaceData(data)

  const chartConfig: ChartConfig = {
    value: {
      label: 'Quantidade',
    },
    ...Object.keys(raceColors).reduce((acc, key) => {
      acc[key] = { label: key, color: raceColors[key] }
      return acc
    }, {} as ChartConfig),
  }

  return (
    <GenericBarChart
      data={raceChartData}
      chartConfig={chartConfig}
      barColor="blue"
      dataKey="value"
      nameKey="name"
    />
  )
}

export default RaceChart
