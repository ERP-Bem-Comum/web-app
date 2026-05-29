import { resultFetch, type FetchOptions, type HttpError } from '@/shared/http/result-fetch'
import { env } from '@/server/env'
import { ResultAsync } from 'neverthrow'

export { type HttpError, type FetchOptions, mapHttpError } from '@/shared/http/result-fetch'

/**
 * Wrapper server-side que injeta baseURL do env nas Server Functions.
 */
export function serverFetch<T>(
  path: string,
  init?: FetchOptions,
): ResultAsync<T, HttpError> {
  const url = path.startsWith('http') ? path : `${env.CORE_API_URL}${path}`
  return resultFetch<T>(url, init)
}
