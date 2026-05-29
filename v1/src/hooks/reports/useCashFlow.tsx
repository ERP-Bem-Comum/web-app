import { useGetCashFlow, useGetCashFlowChart } from '@/services/reports'
import useReportFilter from './useReportFilter'
import { useCashFlowReturn } from '@/types/reports/cashFlow'

const useCashFlow = (): useCashFlowReturn => {
  const form = useReportFilter()

  const { cashFlow, isLoadingCashFlow } = useGetCashFlow(form.values)

  const { chartData, isLoadingChartData } = useGetCashFlowChart(form.values)

  return {
    data: cashFlow?.data,
    isLoading: isLoadingCashFlow,
    chart: {
      data: chartData?.data,
      isLoading: isLoadingChartData,
    },
    form,
  }
}

export { useCashFlow }
