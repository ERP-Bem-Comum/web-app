import React, { useMemo } from 'react'
import GenericBarChart from '@/components/layout/charts/BarChart'
import { maskMonetaryValue } from '@/utils/masks'
import { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountsPosition, AccountsPositionType } from '@/types/reports/accountsPosition'
import PieChartDonut from '@/components/layout/charts/PieChartDonut'

interface AccountsChartsProps {
  data: AccountsPosition
  type: AccountsPositionType
}

function transformAccountsData({ itens }: AccountsPosition) {
  return itens.map((item) => ({
    name: item.name,
    totalPendente: item.totalPendente,
    totalPago: item.totalPago,
    totalAtrasado: item.totalAtrasado,
  }))
}

function transformResumeTotalData({ totalPendente, totalPago, totalAtrasado }: AccountsPosition) {
  return [
    { name: 'Total Pendente', value: totalPendente, fill: '#FFA500' },
    { name: 'Total Pago', value: totalPago, fill: '#008000' },
    { name: 'Total Atrasado', value: totalAtrasado, fill: '#FF0000' },
  ]
}

const AccountsCharts = ({ data, type }: AccountsChartsProps) => {
  const nameAccount = type === 'payable' ? 'Fornecedor' : 'Financiador'
  const accountsChartData = useMemo(() => transformAccountsData(data), [data])
  const resumeTotalData = useMemo(() => transformResumeTotalData(data), [data])
  const valueFormatter = (value: ValueType) => maskMonetaryValue(value as number)
  if (!data) return null

  return (
    <div id="chart-pdf-export-container" className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Resumo total</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChartDonut
            data={resumeTotalData}
            chartConfig={{
              totalPendente: { label: 'Total Pendente', color: '#FFA500' },
              totalPago: { label: 'Total Pago', color: '#008000' },
              totalAtrasado: { label: 'Total Atrasado', color: '#FF0000' },
              'Total Pendente': { label: 'Pendente', color: '#FFA500' },
              'Total Pago': { label: 'Pago', color: '#008000' },
              'Total Atrasado': { label: 'Atrasado', color: '#FF0000' },
            }}
            nameKey="name"
            dataKey="value"
            valueFormatter={valueFormatter}
            total={data.totalAtrasado + data.totalPago + data.totalPendente}
            totalLabel="Total"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição por {nameAccount}</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericBarChart
            data={accountsChartData}
            chartConfig={{
              totalPendente: { label: 'Total Pendente', color: '#FFA500' },
              totalPago: { label: 'Total Pago', color: '#008000' },
              totalAtrasado: { label: 'Total Atrasado', color: '#FF0000' },
            }}
            barColor="blue"
            nameKey="name"
            layout="multiple"
            valueFormatter={valueFormatter}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default AccountsCharts
