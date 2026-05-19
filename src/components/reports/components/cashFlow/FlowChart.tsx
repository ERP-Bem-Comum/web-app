import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'
import { maskMonetaryValue } from '@/utils/masks'
import { CashFlowDataForChart } from '@/types/reports/cashFlow'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { COLOR_EXPECTED, COLOR_REALIZED } from '@/configurations/colors'

interface FlowChartDataProps {
  data?: CashFlowDataForChart
}

const FlowChartData = ({ data }: FlowChartDataProps) => {
  const options: Highcharts.Options = {
    chart: {
      type: 'line',
      renderTo: 'container',
      backgroundColor: '#F6FAFB',
      panning: {
        enabled: true,
        type: 'x',
      },
      panKey: 'shift',
    },
    title: {
      text: '',
    },
    xAxis: {
      visible: true,
      categories: data?.map((item) => item.Installments_dueDate),
      scrollbar: {
        enabled: true,
        height: 5,
        showFull: true,
      },

      min: 0,
      max: 10,
    },
    yAxis: [
      {
        visible: true,
        type: 'linear',
      },
    ],
    legend: {
      shadow: false,
      enabled: true,
    },
    tooltip: {
      enabled: true,
      formatter: function () {
        // Add the formatter function
        return `${this.series.name}<br/>${this.x}: <b>${maskMonetaryValue(Number(this.y))}</b>`
      },
    },
    /* series: cashFlow.data.map((item) => ({
      type: 'column',
      name: item.Category_name,
      color: '##E18282',
      data: cashFlow?.data?.map((item) => item.EXPECTED),
      pointPadding: 0,
    })), */
    plotOptions: {
      column: {
        pointWidth: 15,
        groupPadding: 0.1,
        minPointLength: 3,
      },
    },
    series: [
      {
        type: 'line',
        name: 'Esperado',
        color: COLOR_EXPECTED,
        data: data?.map((item) => item.EXPECTED),
      },
      {
        type: 'line',
        name: 'Realizado',
        color: COLOR_REALIZED,
        data: data?.map((item) => item.REALIZED),
      },
      {
        type: 'line',
        name: 'Saldo',
        color: '#78f876',
        data: data?.map((item) => item.EXPECTED - item.REALIZED),
      },
    ],
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linha do tempo</CardTitle>
        <CardDescription>Previsto vs Realizado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[30%]">
          <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}

export default FlowChartData
