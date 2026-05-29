import React from 'react'
import GenericBarChart from '@/components/layout/charts/BarChart'
import { AnalysisReportData } from '@/types/reports/analysis'
import { maskMonetaryValue } from '@/utils/masks'
import { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountsPositionType } from '@/types/reports/accountsPosition'
import { useGetFinanciersChart } from '@/services/reports'

interface AnalysisChartsProps {
  data?: AnalysisReportData
  type: AccountsPositionType
}

const AnalysisCharts = ({ data, type }: AnalysisChartsProps) => {
  if (!data) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data: financiers } = useGetFinanciersChart()

  const transformCostCenterData = (data: AnalysisReportData) => {
    const costCenterData = data.data.reduce(
      (acc, curr) => {
        curr.CostCenter.forEach((costCenter) => {
          acc[costCenter.name] = (acc[costCenter.name] || 0) + costCenter.total
        })
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(costCenterData).map(([name, value]) => ({
      name,
      value,
    }))
  }

  const transformMonthlyData = (data: AnalysisReportData) => {
    const monthlyData = data.data.reduce(
      (acc, curr) => {
        curr.itens.forEach((item) => {
          const month = new Date(item.monthYear).toLocaleString('default', { month: 'short' })
          acc[month] = (acc[month] || 0) + item.total
        })
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(monthlyData).map(([name, value]) => ({
      name,
      value,
    }))
  }

  const transformFunderData = () => {
    // Dados mockados para financiadores
    const funderData = [
      { name: 'Renan', value: 100000 },
      { name: 'Vinicios', value: 150000 },
      { name: 'Caio', value: 200000 },
    ]

    return funderData
  }

  const costCenterChartData = transformCostCenterData(data)
  const monthlyChartData = transformMonthlyData(data)
  const funderChartData = transformFunderData()

  const valueFormatter = (value: ValueType) => maskMonetaryValue(value as number)

  return (
    <div id="chart-pdf-export-container" className="flex flex-col gap-8 mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Centro de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericBarChart
            className="m-auto max-h-[500px]"
            data={costCenterChartData}
            chartConfig={{
              value: {
                label: 'Total',
              },
            }}
            barColor="#32C6F4"
            dataKey="value"
            nameKey="name"
            layout="horizontal"
            valueFormatter={valueFormatter}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericBarChart
            data={monthlyChartData}
            chartConfig={{
              value: {
                label: 'Total',
              },
            }}
            barColor="#32C6F4"
            dataKey="value"
            nameKey="name"
            layout="vertical"
            valueFormatter={valueFormatter}
          />
        </CardContent>
      </Card>

      {type === 'receivable' && financiers?.data && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Financiador</CardTitle>
          </CardHeader>
          <CardContent>
            <GenericBarChart
              className="m-auto max-h-[500px]"
              data={financiers?.data?.map((funder) => ({
                name: funder.name,
                value: funder.total,
              }))}
              chartConfig={{
                value: {
                  label: 'Total',
                },
              }}
              barColor="#32C6F4"
              dataKey="value"
              nameKey="name"
              layout="horizontal"
              valueFormatter={valueFormatter}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AnalysisCharts
