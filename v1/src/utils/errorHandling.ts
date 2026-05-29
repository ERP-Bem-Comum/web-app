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

/**
 * Verifica se o erro é o esperado quando o backend está offline
 * em modo AUTH_BYPASS_ENABLED (401/403 interceptado).
 */
export function isBackendOfflineError(error: unknown): error is { isBackendOffline: boolean } {
  return typeof error === 'object' && error !== null && 'isBackendOffline' in error
}
