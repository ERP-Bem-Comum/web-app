import React from 'react'
import GenericBarChart from '@/components/layout/charts/BarChart'
import { CollaboratorData } from '@/types/reports/team'

interface RoleChartProps {
  data: CollaboratorData[]
}

const RoleChart = ({ data }: RoleChartProps) => {
  const transformRoleData = (data: CollaboratorData[]) => {
    const roleData = data.reduce(
      (acc, curr) => {
        const role = curr.role || 'N/A'
        acc[role] = (acc[role] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(roleData).map(([name, value]) => ({
      name,
      value,
    }))
  }

  const roleChartData = transformRoleData(data)

  return (
    <GenericBarChart
      data={roleChartData}
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

export default RoleChart
