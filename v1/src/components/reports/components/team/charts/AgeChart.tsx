import React from 'react'
import GenericBarChart from '@/components/layout/charts/BarChart'
import { CollaboratorData } from '@/types/reports/team'

interface AgeChartProps {
  data: CollaboratorData[]
}

const AgeChart = ({ data }: AgeChartProps) => {
  const transformAgeData = (data: CollaboratorData[]) => {
    const ageData = data.reduce(
      (acc, curr) => {
        if (curr.dateOfBirth) {
          const age = new Date().getFullYear() - new Date(curr.dateOfBirth).getFullYear()
          if (age <= 29) acc['Até 29'] = (acc['Até 29'] || 0) + 1
          else if (age <= 39) acc['30 a 39'] = (acc['30 a 39'] || 0) + 1
          else if (age <= 49) acc['40 a 49'] = (acc['40 a 49'] || 0) + 1
          else if (age <= 59) acc['50 a 59'] = (acc['50 a 59'] || 0) + 1
          else acc['60+'] = (acc['60+'] || 0) + 1
        } else {
          acc['N/A'] = (acc['N/A'] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(ageData)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => {
        const ageOrder = ['Até 29', '30 a 39', '40 a 49', '50 a 59', '60+', 'N/A']
        return ageOrder.indexOf(a.name) - ageOrder.indexOf(b.name)
      })
  }

  const ageChartData = transformAgeData(data)

  return (
    <GenericBarChart
      data={ageChartData}
      chartConfig={{
        value: {
          label: 'Quantidade',
        },
      }}
      barColor="#32C6F4"
      dataKey="value"
      nameKey="name"
      layout="vertical"
    />
  )
}

export default AgeChart
