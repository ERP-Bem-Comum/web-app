import {
  AppointmentRow,
  SearchAppointmentParams,
  useGetAppointmentsProps,
} from '@/types/searchAppointments'
import { zodResolver } from '@hookform/resolvers/zod'
import { searchAppointmentsSchema } from '@/validators/searchAppointments'
import { useGetAppointments } from '@/services/reconciliation'
import { useCallback, useEffect, useState } from 'react'
import { debounce } from '@/utils/debounce'
import { parseISO } from 'date-fns'
import { useForm } from 'react-hook-form'

export const useAppointments = (
  onClose: () => void,
  rowCallBack: (row: AppointmentRow) => void,
  accountId: number,
  dueBetween: { start: Date; end: Date },
): useGetAppointmentsProps => {
  const [selectedItem, setSelectedItem] = useState<AppointmentRow>()

  const {
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<SearchAppointmentParams>({
    resolver: zodResolver(searchAppointmentsSchema),
    defaultValues: {
      searchAppointmentParams: {
        accountId,
        dueBetween: dueBetween ?? {
          start: parseISO('2024-11-01T00:00:00-03:00'),
          end: parseISO('2025-12-01T00:00:00-03:00'),
        },
      },
      paginationParams: {
        page: 1,
        limit: 5,
      },
    },
  })

  const values = watch()

  const { appointments, isLoadingAppointments, refetchAppointments } = useGetAppointments(values)

  const debouncedRefetch = useCallback(
    () =>
      debounce(
        async () => {
          await refetchAppointments()
        },
        500,
        { maxWait: 5000 },
      ),
    [refetchAppointments],
  )

  const handleOnFilter = async (SearchByCPForCNPJ?: string) => {
    setValue('searchAppointmentParams.CNPJorNameSearch', SearchByCPForCNPJ)
    await handleSubmit(
      async () => await debouncedRefetch(),
      (error) => console.error(error),
    )()
  }

  const handleCallBack = () => {
    if (selectedItem) {
      rowCallBack(selectedItem)
      onClose()
    }
  }

  useEffect(() => {
    handleOnFilter()
    return () => {
      debouncedRefetch().cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.searchAppointmentParams.identificationCodeSearch])

  return {
    form: { control, setValue, errors },
    handleOnFilter,
    handleCallBack,
    setSelectedItem,
    reset,
    data: appointments,
    isLoadingAppointments,
    values,
    selectedItem,
  }
}
