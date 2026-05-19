import { Response } from '@/types/global'
import { isAxiosError } from 'axios'

export const handleError = <T>(error: unknown): Response<T> => {
  if (isAxiosError(error)) {
    return {
      status: error.response?.status || 500, // Fallback to 500 if status is undefined
      error: error.response?.data?.message || 'An unknown error occurred',
      meta: null,
    }
  } else {
    return {
      status: 500,
      error: 'An unexpected error occurred',
      meta: null,
    }
  }
}
