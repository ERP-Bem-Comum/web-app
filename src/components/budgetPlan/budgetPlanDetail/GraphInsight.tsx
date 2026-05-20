'use client'
import { useEffect, useState } from 'react'
import { Bar, BarChart, Cell, ReferenceLine } from 'recharts'

interface IGraphInsight {
  averageValue: number
  listData: any[]
  changeColumnSelect: (index: number) => void
}

const SELECTED_COLOR = '#32C6F4'
const UNSELECTED_COLOR = '#AFB2B2'

export function GraphInsight({ averageValue, listData, changeColumnSelect }: IGraphInsight) {
  const [selectedColumn, setSelectedColumn] = useState<number>(listData.length - 1)

  useEffect(() => {
    setSelectedColumn(listData.length - 1)
  }, [listData])

  // Espelha o shape original (0 sentinel no início e no fim) para preservar visual.
  const chartData = [
    { name: 'start', value: 0 },
    ...listData.map((d) => ({ name: String(d?.id ?? ''), value: d?.totalInCents ?? 0 })),
    { name: 'end', value: 0 },
  ]

  const handleBarClick = (_: unknown, index: number) => {
    setSelectedColumn(index)
    // -1 para compensar o sentinel inicial — mesmo offset do código antigo.
    changeColumnSelect(index - 1)
  }

  return (
    <BarChart
      width={180}
      height={100}
      data={chartData}
      style={{ backgroundColor: '#F6FAFB' }}
      margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
    >
      <Bar dataKey="value" onClick={handleBarClick} cursor="pointer">
        {chartData.map((_, index) => (
          <Cell
            key={`cell-${index}`}
            fill={index === selectedColumn ? SELECTED_COLOR : UNSELECTED_COLOR}
          />
        ))}
      </Bar>
      <ReferenceLine y={averageValue} stroke="#000" strokeDasharray="4 4" strokeWidth={1} />
    </BarChart>
  )
}
