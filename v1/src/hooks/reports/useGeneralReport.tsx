import { useGetGeneralReport } from '@/services/reports'
import useReportFilter from './useReportFilter'
import { useGeneralReportReturn } from '@/types/reports/generalReport'
import { filterReportParamsWithColumns } from '@/types/reports/filters'
import { DISPONIBLE_COLUMNS } from '@/enums/generalReport'

const useGeneralReport = (): useGeneralReportReturn => {
  const form = useReportFilter<filterReportParamsWithColumns>({
    reportsParams: {
      dueBetween: {
        start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        end: new Date(),
      },
    },
    columns: Object.keys(DISPONIBLE_COLUMNS) as Array<keyof typeof DISPONIBLE_COLUMNS>,
  })

  const { data, isLoading } = useGetGeneralReport(form.values)

  return {
    data: data?.data,
    meta: data?.meta,
    isLoading,
    form,
  }
}

export { useGeneralReport }
