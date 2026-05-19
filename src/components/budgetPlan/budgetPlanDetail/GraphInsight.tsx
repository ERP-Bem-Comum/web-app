import { useEffect, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

interface IGraphInsight {
  averageValue: number
  listData: any[]
  changeColumnSelect: any
}

export function GraphInsight({ averageValue, listData, changeColumnSelect }: IGraphInsight) {
  const [selectedColumn, setSelectedColumn] = useState(0)

  const getDataSeries = () => {
    const series = [] as number[]
    series.push(0)
    listData.forEach((data) => {
      series.push(data?.totalInCents)
    })
    series.push(0)

    return series
  }

  useEffect(() => {
    getDataSeries()
    setSelectedColumn(listData.length - 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listData])

  const options = {
    chart: {
      type: 'column',
      backgroundColor: '#F6FAFB',
      height: 100,
      width: 180,
    },
    title: {
      text: '',
    },
    xAxis: {
      visible: false,
    },
    yAxis: [
      {
        min: 0,
        title: {
          text: '',
        },
        visible: false,
      },
    ],
    legend: {
      shadow: false,
      enabled: false,
    },
    tooltip: {
      shared: true,
      enabled: false,
    },
    plotOptions: {
      column: {
        grouping: false,
        shadow: false,
        borderWidth: 0,
        cursor: 'pointer',
        point: {
          events: {
            click: function (this: any) {
              this.series?.points.forEach((point: any) => {
                point.update({ color: '#AFB2B2' })
              })
              setSelectedColumn(this?.index)
              changeColumnSelect(this?.index - 1)
              this.update({ color: '#32C6F4' })
              // eslint-disable-next-line @typescript-eslint/no-this-alias
            },
          },
        },
      },
    },
    series: [
      {
        name: 'Planejado',
        color: '#E0E4E4',
        data: getDataSeries(),
        pointPadding: 0,
      },
      {
        name: 'Realizado',
        color: '#AFB2B2',
        data: getDataSeries(),
        pointPadding: 0,
      },
      {
        name: 'Average',
        type: 'line',
        data: [
          averageValue,
          averageValue,
          averageValue,
          averageValue,
          averageValue,
          averageValue,
          averageValue,
        ],
        color: '#000',
        dashStyle: 'Dash',
        marker: {
          enabled: false,
        },
        lineWidth: 1,
        enableMouseTracking: false,
      },
    ],
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />
}
