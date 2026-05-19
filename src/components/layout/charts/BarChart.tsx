'use client'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { ValueType } from 'recharts/types/component/DefaultTooltipContent'

// Função para quebrar títulos longos por espaços
const formatLongTitle = (title: string): string[] => {
  const words = title.split(' ')
  if (words.length <= 1) {
    return [title]
  }
  
  // Sempre quebrar após o primeiro espaço
  const firstWord = words[0]
  const remainingWords = words.slice(1).join(' ')
  
  return [firstWord, remainingWords]
}

const CustomTick = ({ x, y, payload }: any) => {
  const lines = formatLongTitle(payload.value)
  
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={index * 12}
          textAnchor="middle"
          fill="#666"
          fontSize={12}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

// Componente customizado para renderizar labels verticais com quebra de linha
const CustomVerticalLabel = ({ x, y, value }: any) => {
  const lines = formatLongTitle(value)
  
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={-8}
          y={index * 12}
          textAnchor="end"
          fill="#666"
          fontSize={12}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

interface GenericBarChartProps<T> {
  data: T[]
  chartConfig: ChartConfig
  barColor: string
  labelColor?: string
  dataKey?: keyof T // opcional no caso de layout === 'multiple'
  nameKey: keyof T
  layout?: 'vertical' | 'horizontal' | 'multiple' | 'multipleVertical'
  valueFormatter?: (value: ValueType) => string
  maxHeight?: string
  className?: string
}

function GenericBarChart<T>({
  data,
  chartConfig,
  barColor,
  dataKey,
  nameKey,
  layout = 'horizontal',
  labelColor = '#000',
  valueFormatter,
  className,
}: GenericBarChartProps<T>) {
  return (
    <ChartContainer config={chartConfig} className={className}>
      <BarChart
        layout={layout === 'vertical' || layout === 'multipleVertical' ? 'vertical' : 'horizontal'}
        data={data}
        margin={{
          top: 40,
          left: layout === 'vertical' || layout === 'multipleVertical' ? 100 : 10,
          right: layout === 'vertical' || layout === 'multipleVertical' ? 100 : 10,
          bottom: 40,
        }}
      >
        {/* <CartesianGrid
          vertical={layout === 'vertical' || layout === 'multipleVertical'}
          horizontal={layout === 'horizontal' || layout === 'multiple'}
        /> */}
        {layout === 'vertical' && (
          <>
            <YAxis
              dataKey={nameKey as string}
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" valueFormatter={valueFormatter} />}
            />
            <Bar dataKey={dataKey as string} layout="vertical" fill={barColor} radius={4}>
              <LabelList
                dataKey={nameKey as string}
                position="left"
                offset={8}
                fill={labelColor}
                fontSize={12}
                content={<CustomVerticalLabel />}
              />
              <LabelList
                dataKey={dataKey as string}
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={valueFormatter}
              />
            </Bar>
          </>
        )}

        {layout === 'horizontal' && (
          <>
            <XAxis
              dataKey={nameKey as string}
              tickLine={false}
              axisLine={false}
              tickMargin={2}
              minTickGap={10}
              tick={<CustomTick />}
              interval={0}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent label={nameKey as string} valueFormatter={valueFormatter} />
              }
            />
            <Bar dataKey={dataKey as string} fill={barColor} radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={valueFormatter}
              />
            </Bar>
          </>
        )}

        {layout === 'multiple' && (
          <>
            <XAxis 
              dataKey={nameKey as string} 
              tickLine={false} 
              tickMargin={10} 
              axisLine={false}
              tick={<CustomTick />}
              interval={0}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent label={nameKey as string} valueFormatter={valueFormatter} />
              }
            />
            {Object.keys(chartConfig).map((key) => (
              <Bar key={key} dataKey={key} fill={chartConfig[key].color} radius={4}>
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={valueFormatter}
                />
              </Bar>
            ))}
          </>
        )}

        {layout === 'multipleVertical' && (
          <>
            <YAxis
              dataKey={nameKey as string}
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" valueFormatter={valueFormatter} />}
            />
            {Object.keys(chartConfig).map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                layout="vertical"
                fill={chartConfig[key].color}
                radius={4}
              >
                {index === 0 && (
                  <LabelList
                    dataKey={nameKey as string}
                    position="left"
                    offset={8}
                    fill={labelColor}
                    fontSize={12}
                    content={<CustomVerticalLabel />}
                  />
                )}
                <LabelList
                  dataKey={key}
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={valueFormatter}
                />
              </Bar>
            ))}
          </>
        )}
      </BarChart>
    </ChartContainer>
  )
}

export default GenericBarChart
