import { FilterRealizedReportParams, useReportFilterReturn } from '@/types/reports/realized'
import { reportsFilterSchema } from '@/validators/reports/filters'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

const useRealizedReportFilter = (
  defaultReportParams?: FilterRealizedReportParams,
): useReportFilterReturn => {
  const [params, setParams] = useState<FilterRealizedReportParams>(
    defaultReportParams || {
      year: new Date(),
    },
  )

  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FilterRealizedReportParams>({
    resolver: zodResolver(reportsFilterSchema),
    defaultValues: defaultReportParams,
  })

  const values = watch()

  const clearField = useCallback(
    (field: keyof FilterRealizedReportParams) => {
      setValue(field, undefined)
    },
    [setValue],
  )

  const handleFilter = useCallback(() => {
    setParams(values)
  }, [setParams, values])

  return {
    control,
    watch,
    errors,
    values: params,
    handleFilter,
    clearField,
  }
}

export default useRealizedReportFilter
