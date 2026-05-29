import { filterReportParams, FormParamsReturn } from '@/types/reports/filters'
import { reportsFilterSchema } from '@/validators/reports/filters'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { DefaultValues, Path, PathValue, useForm } from 'react-hook-form'

const useReportFilter = <T extends filterReportParams>(
  defaultValues?: Partial<T>,
): FormParamsReturn<T> => {
  const [params, setParams] = useState<T['reportsParams']>(defaultValues?.reportsParams ?? {})
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<T>({
    resolver: zodResolver(reportsFilterSchema),
    defaultValues: defaultValues as DefaultValues<T>,
  })

  const { paginationParams, reportsParams } = watch()

  const clearField = useCallback(
    (field: keyof T['reportsParams']) => {
      setValue(`reportsParams.${String(field)}` as Path<T>, undefined as PathValue<T, Path<T>>)
    },
    [setValue],
  )

  const handleFilter = useCallback(() => {
    setParams({ ...reportsParams })
  }, [setParams, reportsParams])

  return {
    control,
    clearField,
    handleFilter,
    setValue,
    watch,
    errors,
    values: { ...watch(), reportsParams: params } as T,
  }
}

export default useReportFilter
