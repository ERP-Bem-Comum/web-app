import { useGetRealizedReport } from '@/services/reports'
import { useRealizedReturn } from '@/types/reports/realized'
import useRealizedReportFilter from './useRealizedReportFilter'

const useRealized = (): useRealizedReturn => {
  const form = useRealizedReportFilter({
    year: new Date(),
  })

  const { data, isLoading } = useGetRealizedReport(form.values)

  return {
    data: data?.data,
    isLoading,
    form,
  }
}

export { useRealized }
