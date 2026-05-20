// Wrapper de fetch com shape compatível com axios — substitui `axios` no projeto.
// Cobre o subset realmente usado: get/post/put/patch/delete, `params`, `responseType: 'blob'`,
// FormData (auto-detectado via Content-Type), `Authorization` injetado, hook de 401.

export type HttpRequestConfig = {
  params?: Record<string, unknown> | undefined
  headers?: Record<string, string> | undefined
  responseType?: 'json' | 'blob' | 'text' | 'arraybuffer'
  signal?: AbortSignal
  baseURL?: string
  /**
   * Quando provido, o cliente NÃO faz throw em statuses que retornem `true`.
   * Default: `status < 400`. Use `() => true` para sempre resolver e inspecionar `response.status`.
   */
  validateStatus?: (status: number) => boolean
}

export type HttpResponse<T = unknown> = {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
}

export type HttpErrorResponse = {
  status: number
  statusText: string
  data: unknown
  headers: Record<string, string>
}

export class HttpError extends Error {
  readonly response?: HttpErrorResponse
  readonly request?: unknown
  readonly isHttpError = true as const

  constructor(message: string, response?: HttpErrorResponse, request?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.response = response
    this.request = request
  }
}

export const isHttpError = (e: unknown): e is HttpError =>
  e instanceof HttpError ||
  (typeof e === 'object' && e !== null && (e as { isHttpError?: boolean }).isHttpError === true)

type RequestHook = (init: RequestInit, url: string) => Promise<RequestInit> | RequestInit
type ResponseErrorHook = (error: HttpError) => void | Promise<void>

export type CreateHttpClientOptions = {
  baseURL?: string
  onRequest?: RequestHook
  onUnauthorized?: (error: HttpError) => void
}

export type HttpClient = {
  get: <T = unknown>(url: string, config?: HttpRequestConfig) => Promise<HttpResponse<T>>
  post: <T = unknown>(
    url: string,
    body?: unknown,
    config?: HttpRequestConfig,
  ) => Promise<HttpResponse<T>>
  put: <T = unknown>(
    url: string,
    body?: unknown,
    config?: HttpRequestConfig,
  ) => Promise<HttpResponse<T>>
  patch: <T = unknown>(
    url: string,
    body?: unknown,
    config?: HttpRequestConfig,
  ) => Promise<HttpResponse<T>>
  delete: <T = unknown>(url: string, config?: HttpRequestConfig) => Promise<HttpResponse<T>>
}

const serializeQuery = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v === undefined || v === null) continue
        search.append(key, String(v))
      }
    } else {
      search.append(key, String(value))
    }
  }
  const str = search.toString()
  return str ? `?${str}` : ''
}

const buildUrl = (
  baseURL: string | undefined,
  path: string,
  params: Record<string, unknown> | undefined,
): string => {
  const isAbsolute = /^https?:\/\//i.test(path)
  const base = baseURL && !isAbsolute ? baseURL.replace(/\/+$/, '') : ''
  const cleanPath = isAbsolute ? path : path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}${params ? serializeQuery(params) : ''}`
}

const headersToRecord = (headers: Headers): Record<string, string> => {
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    out[key] = value
  })
  return out
}

const toFormDataIfMultipart = (body: unknown, headers: Record<string, string>): unknown => {
  const contentType = headers['Content-Type'] ?? headers['content-type']
  if (!contentType || !contentType.startsWith('multipart/form-data')) return body
  if (body instanceof FormData) return body
  if (body === null || body === undefined) return body
  if (typeof body !== 'object') return body

  const form = new FormData()
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      const arrayKey = `${key}[]`
      for (const v of value) {
        if (v instanceof File || v instanceof Blob) {
          form.append(key, v)
        } else if (typeof v === 'object' && v !== null) {
          form.append(arrayKey, JSON.stringify(v))
        } else {
          form.append(arrayKey, String(v))
        }
      }
    } else if (value instanceof File || value instanceof Blob) {
      form.append(key, value)
    } else if (value !== undefined && value !== null) {
      form.append(key, String(value))
    }
  }
  // Quando o body vira FormData o browser precisa definir o boundary — apagamos o Content-Type.
  delete headers['Content-Type']
  delete headers['content-type']
  return form
}

const parseResponseBody = async (
  response: Response,
  responseType: HttpRequestConfig['responseType'],
): Promise<unknown> => {
  if (response.status === 204) return undefined
  if (responseType === 'blob') return await response.blob()
  if (responseType === 'arraybuffer') return await response.arrayBuffer()
  if (responseType === 'text') return await response.text()

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const text = await response.text()
    return text ? JSON.parse(text) : undefined
  }
  // Default: tenta JSON, cai pra texto.
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const createHttpClient = ({
  baseURL,
  onRequest,
  onUnauthorized,
}: CreateHttpClientOptions): HttpClient => {
  const request = async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    body: unknown,
    config: HttpRequestConfig = {},
  ): Promise<HttpResponse<T>> => {
    const headers: Record<string, string> = { ...(config.headers ?? {}) }
    let payload: unknown = body

    if (payload !== undefined && payload !== null && method !== 'GET') {
      payload = toFormDataIfMultipart(payload, headers)
      if (!(payload instanceof FormData) && !(payload instanceof Blob) && typeof payload === 'object') {
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json'
        }
        payload = JSON.stringify(payload)
      }
    }

    const init: RequestInit = {
      method,
      headers,
      signal: config.signal,
    }
    if (payload !== undefined && method !== 'GET') {
      init.body = payload as BodyInit
    }

    const finalInit = onRequest ? await onRequest(init, url) : init
    const fullUrl = buildUrl(config.baseURL ?? baseURL, url, config.params)

    let response: Response
    try {
      response = await fetch(fullUrl, finalInit)
    } catch (cause) {
      throw new HttpError(cause instanceof Error ? cause.message : 'Network error', undefined, cause)
    }

    const responseHeaders = headersToRecord(response.headers)
    const isOk = config.validateStatus
      ? config.validateStatus(response.status)
      : response.status >= 200 && response.status < 400

    if (!isOk) {
      const data = await parseResponseBody(response, config.responseType).catch(() => undefined)
      const error = new HttpError(`Request failed with status code ${response.status}`, {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: responseHeaders,
      })
      if (response.status === 401 && onUnauthorized) {
        try {
          onUnauthorized(error)
        } catch {
          /* swallow — handler é fire-and-forget */
        }
      }
      throw error
    }

    const data = (await parseResponseBody(response, config.responseType)) as T
    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    }
  }

  return {
    get: (url, config) => request('GET', url, undefined, config),
    post: (url, body, config) => request('POST', url, body, config),
    put: (url, body, config) => request('PUT', url, body, config),
    patch: (url, body, config) => request('PATCH', url, body, config),
    delete: (url, config) => request('DELETE', url, undefined, config),
  }
}
