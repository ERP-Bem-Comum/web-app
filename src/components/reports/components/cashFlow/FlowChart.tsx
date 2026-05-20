'use client'
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts'
import { maskMonetaryValue } from '@/utils/masks'
import { CashFlowDataForChart } from '@/types/reports/cashFlow'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { COLOR_EXPECTED, COLOR_REALIZED } from '@/configurations/colors'

interface FlowChartDataProps {
  data?: CashFlowDataForChart
}

type ChartRow = {
  label: string
  EXPECTED: number
  REALIZED: number
  SALDO: number
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium text-slate-600">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey as string} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-semibold">{maskMonetaryValue(Number(entry.value ?? 0))}</span>
        </div>
      ))}
    </div>
  )
}

const FlowChartData = ({ data }: FlowChartDataProps) => {
  const chartData: ChartRow[] =
    data?.map((item) => ({
      label: item.Installments_dueDate,
      EXPECTED: item.EXPECTED,
      REALIZED: item.REALIZED,
      SALDO: item.EXPECTED - item.REALIZED,
    })) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linha do tempo</CardTitle>
        <CardDescription>Previsto vs Realizado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height: 360, backgroundColor: '#F6FAFB' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E4E4" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#666' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#666' }}
                tickFormatter={(v) => maskMonetaryValue(Number(v))}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="EXPECTED"
                name="Esperado"
                stroke={COLOR_EXPECTED}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="REALIZED"
                name="Realizado"
                stroke={COLOR_REALIZED}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="SALDO"
                name="Saldo"
                stroke="#78f876"
                strokeWidth={2}
                dot={false}
              />
              {chartData.length > 10 && (
                <Brush
                  dataKey="label"
                  height={20}
                  stroke="#32C6F4"
                  startIndex={0}
                  endIndex={Math.min(10, chartData.length - 1)}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default FlowChartData
