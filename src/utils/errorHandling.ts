import { isHttpError } from '@/services/http-client'
import { Response } from '@/types/global'

export const handleError = <T>(error: unknown): Response<T> => {
  if (isHttpError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    return {
      status: error.response?.status || 500,
      error: data?.message || 'An unknown error occurred',
      meta: null,
    }
  }
  return {
    status: 500,
    error: 'An unexpected error occurred',
    meta: null,
  }
}
