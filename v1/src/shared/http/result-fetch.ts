import { ofetch, FetchError } from 'ofetch'
import { ResultAsync } from 'neverthrow'

export type HttpError =
  | { kind: 'http'; status: number; body: unknown; statusText?: string }
  | { kind: 'network'; message: string }
  | { kind: 'timeout'; message: string }
  | { kind: 'parse'; message: string }

export type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: BodyInit | Record<string, unknown> | null
  query?: Record<string, string | number | boolean | undefined>
  responseType?: 'json' | 'blob' | 'text' | 'arrayBuffer'
  timeout?: number
  retry?: number
}

function mapOfetchError(error: unknown): HttpError {
  if (error instanceof FetchError) {
    const status = error.statusCode || error.status || 0
    if (status > 0) {
      return {
        kind: 'http',
        status,
        statusText: error.statusText || error.statusMessage,
        body: error.data ?? error.message,
      }
    }
    if (
      error.message?.toLowerCase().includes('timeout') ||
      (error.cause instanceof DOMException && error.cause.name === 'TimeoutError')
    ) {
      return { kind: 'timeout', message: error.message || 'Request timed out' }
    }
    return { kind: 'network', message: error.message || 'Network error' }
  }

  if (error instanceof Error) {
    if (
      error.name === 'AbortError' ||
      error.message.toLowerCase().includes('timeout')
    ) {
      return { kind: 'timeout', message: error.message }
    }
    return { kind: 'network', message: error.message }
  }

  return { kind: 'network', message: String(error) }
}

export function resultFetch<T>(
  input: string | URL,
  init?: FetchOptions,
): ResultAsync<T, HttpError> {
  return ResultAsync.fromPromise(
    ofetch(input.toString(), {
      method: init?.method || 'GET',
      headers: init?.headers,
      body: init?.body as BodyInit | Record<string, unknown> | undefined,
      query: init?.query,
      responseType: init?.responseType ?? 'json',
      timeout: init?.timeout ?? 10000,
      retry: init?.retry ?? 3,
      retryDelay: 500,
      retryStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
    }) as Promise<T>,
    mapOfetchError,
  )
}

export function mapHttpError(error: HttpError): string {
  if (error.kind === 'http') {
    const msg =
      typeof error.body === 'string'
        ? error.body
        : typeof error.body === 'object' && error.body !== null
          ? ((error.body as Record<string, unknown>).message as string) || JSON.stringify(error.body)
          : String(error.body)
    return `HTTP ${error.status}: ${msg}`
  }
  if (error.kind === 'timeout') {
    return `Timeout: ${error.message}`
  }
  if (error.kind === 'parse') {
    return `Parse error: ${error.message}`
  }
  return `Network: ${error.message}`
}
