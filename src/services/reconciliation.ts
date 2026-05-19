import { Response } from '@/types/global'
import { AppointmentRow, SearchAppointmentParams } from '@/types/searchAppointments'
import api from './api'
import { handleError } from '@/utils/errorHandling'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CreateBankReconciliation, CreatebankRecordApiOutput } from '@/types/reconciliation'
import { responseNewConciliation } from './bankDetails'
import { flattenParams } from '@/utils/flattenParams'
import { queryClient } from 'lib/react-query'

export const useGetAppointments = (params: SearchAppointmentParams) => {
  const {
    isLoading: isLoadingAppointments,
    data: appointments,
    refetch: refetchAppointments,
  } = useQuery({
    queryKey: ['appointments', params],
    queryFn: () => getAppointments(params),
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    throwOnError: true,
  })

  return { isLoadingAppointments, appointments, refetchAppointments }
}

const getAppointments = async (
  params: SearchAppointmentParams,
): Promise<Response<AppointmentRow[]>> => {
  try {
    const resp = await api.get('/bank-reconciliation/search', {
      params: flattenParams(params),
    })

    return {
      status: resp.status,
      data: resp.data.items ?? [],
      error: '',
      meta: resp.data.meta,
    }
  } catch (error) {
    console.error(error)
    return handleError<AppointmentRow[]>(error)
  }
}

export const createReconciliation = async (
  dataRecordAPI: CreatebankRecordApiOutput,
  dataReconciliation: CreateBankReconciliation,
): Promise<Response<responseNewConciliation>> => {
  try {
    const resp = await api.post('/bank-reconciliation', {
      dataRecordAPI,
      dataReconciliation,
    })

    return {
      status: resp.status,
      data: resp.data as responseNewConciliation,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<responseNewConciliation>(error)
  } finally {
    queryClient.invalidateQueries({ queryKey: ['filteredPayables'] })
    queryClient.invalidateQueries({ queryKey: ['filteredReceivables'] })
  }
}

export const deleteReconciliation = async (
  id: number,
): Promise<Response<{ newBalance: number }>> => {
  try {
    const resp = await api.delete<{ newBalance: number }>(`/bank-reconciliation/${id}`)

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<{ newBalance: number }>(error)
  } finally {
    queryClient.invalidateQueries({ queryKey: ['filteredPayables'] })
    queryClient.invalidateQueries({ queryKey: ['filteredReceivables'] })
  }
}
