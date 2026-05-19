import { useGetNoContractsReport } from '@/services/reports'
import useReportFilter from './useReportFilter'
import { useNoContractsReturn } from '@/types/reports/noContracts'

const useNoContracts = (): useNoContractsReturn => {
  const form = useReportFilter()

  const { data, isLoading } = useGetNoContractsReport(form.values)

  return {
    data: data?.data,
    isLoading,
    form,
  }
}

export { useNoContracts }
