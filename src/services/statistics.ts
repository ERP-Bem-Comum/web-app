import { DashboardStatistics } from '@/types/statistics'
import api from './api'
import { Response } from '@/types/global'
import { handleError } from '@/utils/errorHandling'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

async function getDashboardStatistics(): Promise<Response<DashboardStatistics>> {
  try {
    const resp = await api.get('/statistics/dashboard')

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<DashboardStatistics>(error)
  }
}

export const useGetDashboardStatistics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['DashboardStatistics'],
    queryFn: getDashboardStatistics,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  })

  return {
    data,
    isLoading,
  }
}
