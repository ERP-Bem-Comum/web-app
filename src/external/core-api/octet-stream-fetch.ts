/**
 * octetStreamFetch — POST de corpo BINÁRIO cru (`application/octet-stream`) → Result<T, HttpError>.
 * Irmão do `resultFetch` para upload de documentos: o `resultFetch` serializa o body como JSON e injeta
 * `content-type: application/json`; aqui o body é um `Uint8Array` e o content-type é octet-stream.
 * Metadados vão na query string (o core-api lê `categoria`/`fileName`/`mimeType`/`signedElectronically`
 * por query — ver rota `POST /contracts/:id/documents`). NUNCA lança (tudo é Result). Server-only.
 * Base: globalThis.fetch (constituição §VIII — preferir nativo). Mesma cadeia de erro do resultFetch (§V).
 */
import type { HttpError } from '#shared/http/http-error.types.ts'
import { ok, err, type Result } from '#shared/primitives/result.ts'

export type OctetStreamFetchOptions = Readonly<{
  token?: string
  bytes: Uint8Array
  query?: Readonly<Record<string, string>>
  headers?: Readonly<Record<string, string>>
  signal?: AbortSignal
  timeoutMs?: number
}>

const safeReadBody = async (r: Response): Promise<unknown> => {
  const text = await r.text()
  if (text === '') return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export const octetStreamFetch = async <T>(
  url: string,
  options: OctetStreamFetchOptions,
): Promise<Result<T, HttpError>> => {
  const { token, bytes, query = {}, headers = {}, signal, timeoutMs = 30_000 } = options

  const qs = new URLSearchParams(query).toString()
  const fullUrl = qs === '' ? url : `${url}?${qs}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)
  if (signal) {
    if (signal.aborted) controller.abort()
    else {
      signal.addEventListener('abort', () => {
        controller.abort()
      }, { once: true })
    }
  }

  const requestHeaders: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/octet-stream',
    ...(token !== undefined ? { authorization: `Bearer ${token}` } : {}),
    ...headers,
  }

  let response: Response
  try {
    response = await globalThis.fetch(fullUrl, {
      method: 'POST',
      headers: requestHeaders,
      // `as BodyInit`: Uint8Array é um BodyInit válido em runtime (fetch aceita ArrayBufferView);
      // o cast só satisfaz a tipagem estrita do lib DOM. Sem mutação, dado imutável de entrada.
      body: bytes as unknown as BodyInit,
      signal: controller.signal,
    })
  } catch {
    clearTimeout(timeoutId)
    if (controller.signal.aborted) {
      return err(signal?.aborted === true ? { kind: 'aborted' } : { kind: 'timeout' })
    }
    return err({ kind: 'network' })
  }
  clearTimeout(timeoutId)

  if (!response.ok) {
    return err({ kind: 'http', status: response.status, body: await safeReadBody(response) })
  }
  if (response.status === 204) {
    return ok(undefined as T)
  }
  try {
    const data = (await response.json()) as T
    return ok(data)
  } catch {
    return err({ kind: 'parse' })
  }
}
