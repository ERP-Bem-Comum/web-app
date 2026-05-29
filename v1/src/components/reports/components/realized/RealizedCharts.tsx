import React, { useMemo } from 'react'
import GenericBarChart from '@/components/layout/charts/BarChart'
import { maskMonetaryValue } from '@/utils/masks'
import { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { RealizedExpectedData, CostCenterData, Month } from '@/types/reports/realized'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMonths } from '@/utils/dates'
import GenericPieChart from '@/components/layout/charts/PieChart'
import { COLOR_EXPECTED, COLOR_REALIZED } from '@/configurations/colors'
import { validateMoneyValue } from '@/utils/budgetTotalCalculation'

interface RealizedChartsProps {
  data: RealizedExpectedData
}

const transformCostCenterData = (costCenters: CostCenterData[]) => {
  return costCenters.map((costCenter) => {
    // Calcular totais reais do centro de custo somando todas as categorias e subcategorias
    let totalProvisioned = 0
    let totalRealized = 0
    let totalExpected = 0

    costCenter.categories?.forEach((category) => {
      // Se a categoria tem subcategorias, somar os valores delas
      if (category.subCategories && category.subCategories.length > 0) {
        category.subCategories.forEach((subCategory) => {
          subCategory.months?.forEach((month) => {
            totalProvisioned += validateMoneyValue(month.provisioned)
            totalRealized += validateMoneyValue(month.realized)
            totalExpected += validateMoneyValue(month.expected)
          })
        })
      } else {
        // Se não houver subcategorias, somar os valores da própria categoria
        category.months?.forEach((month) => {
          totalProvisioned += validateMoneyValue(month.provisioned)
          totalRealized += validateMoneyValue(month.realized)
          totalExpected += validateMoneyValue(month.expected)
        })
      }
    })

    return {
      name: costCenter.name,
      totalRealized,
      totalExpected,
      totalProvisioned,
    }
  })
}

const transformMonthlyData = (costCenters: CostCenterData[]) => {
  const monthlyData: {
    [key: string]: {
      totalRealized: number
      totalExpected: number
      totalProvisioned: number
    }
  } = {}

  costCenters.forEach((costCenter) => {
    costCenter.categories.forEach((category) => {
      // Se a categoria tem subcategorias, iterar sobre elas
      if (category.subCategories && category.subCategories.length > 0) {
        category.subCategories.forEach((subCategory) => {
          subCategory.months.forEach((month) => {
            const monthKey = `${month.month}`
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                totalRealized: 0,
                totalExpected: 0,
                totalProvisioned: 0,
              }
            }
            // Validar valores antes de somar para evitar concatenação de strings
            monthlyData[monthKey] = {
              totalRealized: monthlyData[monthKey].totalRealized + validateMoneyValue(month.realized),
              totalExpected: monthlyData[monthKey].totalExpected + validateMoneyValue(month.expected),
              totalProvisioned: monthlyData[monthKey].totalProvisioned + validateMoneyValue(month.provisioned),
            }
          })
        })
      } else {
        // Se não houver subcategorias, usar os meses da própria categoria
        category.months.forEach((month) => {
          const monthKey = `${month.month}`
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              totalRealized: 0,
              totalExpected: 0,
              totalProvisioned: 0,
            }
          }
          // Validar valores antes de somar para evitar concatenação de strings
          monthlyData[monthKey] = {
            totalRealized: monthlyData[monthKey].totalRealized + validateMoneyValue(month.realized),
            totalExpected: monthlyData[monthKey].totalExpected + validateMoneyValue(month.expected),
            totalProvisioned: monthlyData[monthKey].totalProvisioned + validateMoneyValue(month.provisioned),
          }
        })
      }
    })
  })

  return Object.keys(monthlyData).map((month) => ({
    name: getMonths()[parseInt(month) - 1].name,
    totalExpected: monthlyData[month].totalExpected,
    totalRealized: monthlyData[month].totalRealized,
    totalProvisioned: monthlyData[month].totalProvisioned,
  }))
}

const transformRealizedVsExpectedData = (data: RealizedExpectedData) => {
  const totalRealized = validateMoneyValue(data.totalRealized)
  const totalExpected = validateMoneyValue(data.totalExpected)
  const totalProvisioned = validateMoneyValue(data.totalProvisioned)
  const total = totalRealized + totalExpected + totalProvisioned

  return [
    { name: 'Realizado', value: total > 0 ? (totalRealized / total) * 100 : 0, fill: COLOR_REALIZED },
    { name: 'Previsto', value: total > 0 ? (totalExpected / total) * 100 : 0, fill: COLOR_EXPECTED },
    { name: 'Provisionado', value: total > 0 ? (totalProvisioned / total) * 100 : 0, fill: '#FFD700' },
  ]
}

const RealizedCharts = ({ data }: RealizedChartsProps) => {
  const costCenterChartData = useMemo(() => transformCostCenterData(data.costCenters), [data])
  const monthlyChartData = useMemo(() => transformMonthlyData(data.costCenters), [data])
  const realizedVsExpectedData = useMemo(() => transformRealizedVsExpectedData(data), [data])

  const valueFormatter = (value: ValueType) => {
    if (value === 0) return ' '
    return maskMonetaryValue((value as number) / 100, 0)
  }
  const percentageFormatter = (value: ValueType) => Math.round(value as number) + '%'

  if (!data) return null
  return (
    <div id="chart-pdf-export-container" className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Centro de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericBarChart
            className="m-auto max-h-[550px]"
            data={costCenterChartData}
            chartConfig={{
              totalRealized: { label: 'Realizado', color: COLOR_REALIZED },
              totalExpected: { label: 'Previsto', color: COLOR_EXPECTED },
              totalProvisioned: { label: 'Provisionado', color: '#FFD700' },
            }}
            barColor="blue"
            nameKey="name"
            layout="multiple"
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
              totalRealized: { label: 'Realizado', color: COLOR_REALIZED },
              totalExpected: { label: 'Previsto', color: COLOR_EXPECTED },
              totalProvisioned: { label: 'Provisionado', color: '#FFD700' },
            }}
            barColor="green"
            nameKey="name"
            layout="multipleVertical"
            valueFormatter={valueFormatter}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Realizado vs Previsto</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericPieChart
            data={realizedVsExpectedData}
            chartConfig={{
              Realizado: { label: 'Realizado', color: COLOR_REALIZED },
              Previsto: { label: 'Previsto', color: COLOR_EXPECTED },
              Provisionado: { label: 'Provisionado', color: '#FFD700' },
            }}
            dataKey="value"
            nameKey="name"
            valueFormatter={percentageFormatter}
            mode="legend"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default RealizedCharts
