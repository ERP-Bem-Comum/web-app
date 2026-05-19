import { useGetAnalysisReport } from '@/services/reports'
import { useAnalysisReturn } from '@/types/reports/analysis'
import useReportFilter from './useReportFilter'
import { AccountsPositionType } from '@/types/reports/accountsPosition'

const useAnalysis = (type: AccountsPositionType): useAnalysisReturn => {
  const form = useReportFilter({
    reportsParams: {
      dueBetween: {
        start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        end: new Date(),
      },
    },
  })

  const { data, isLoading } = useGetAnalysisReport(form.values, type)

  return {
    data: data?.data,
    isLoading,
    form,
  }
}

export { useAnalysis }
