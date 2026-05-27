export type HttpError =
  | { kind: 'http'; status: number; body: unknown }
  | { kind: 'network'; message: string }
  | { kind: 'timeout'; message: string }

export type Result<T, E = HttpError> =
  | { ok: true; value: Response; data?: T }
  | { ok: false; error: E }

export async function resultFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Result<unknown, HttpError>> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let body: unknown
      try {
        body = await response.json()
      } catch {
        body = await response.text()
      }
      return {
        ok: false,
        error: { kind: 'http', status: response.status, body },
      }
    }

    return { ok: true, value: response }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        error: { kind: 'timeout', message: 'Request timed out after 30s' },
      }
    }
    return {
      ok: false,
      error: {
        kind: 'network',
        message: error instanceof Error ? error.message : 'Network error',
      },
    }
  }
}

export function mapHttpError(error: HttpError): string {
  if (error.kind === 'http') {
    return `HTTP ${error.status}: ${JSON.stringify(error.body)}`
  }
  if (error.kind === 'timeout') {
    return `Timeout: ${error.message}`
  }
  return `Network: ${error.message}`
}
