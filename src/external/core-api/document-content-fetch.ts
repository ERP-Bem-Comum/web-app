/**
 * documentContentFetch — GET de um corpo BINÁRIO (download) → Result<DocumentContent, HttpError>.
 * Irmão do `octetStreamFetch` (que faz o UPLOAD): aqui buscamos os bytes de um documento já anexado,
 * lendo `arrayBuffer()`. O nome original vem do `Content-Disposition` e o tipo do `Content-Type`.
 * NUNCA lança (tudo é Result). Server-only. Base: globalThis.fetch (constituição §VIII — preferir nativo).
 */
import type { HttpError } from '#shared/http/http-error.types.ts'
import { ok, err, type Result } from '#shared/primitives/result.ts'

export type DocumentContent = Readonly<{
  bytes: Uint8Array
  contentType: string
  fileName: string | null
}>

export type DocumentContentFetchOptions = Readonly<{
  token?: string
  signal?: AbortSignal
  timeoutMs?: number
}>

// Extrai o filename do header Content-Disposition (`attachment; filename="contrato.pdf"`).
const parseFileName = (disposition: string | null): string | null => {
  if (disposition === null) return null
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const raw = match?.[1]
  if (raw === undefined || raw === '') return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export const documentContentFetch = async (
  url: string,
  options: DocumentContentFetchOptions = {},
): Promise<Result<DocumentContent, HttpError>> => {
  const { token, signal, timeoutMs = 30_000 } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)
  const onExternalAbort = () => {
    controller.abort()
  }
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onExternalAbort, { once: true })
  }
  const cleanup = () => {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', onExternalAbort)
  }

  const headers: Record<string, string> = {
    accept: 'application/octet-stream, application/pdf, */*',
    ...(token !== undefined ? { authorization: `Bearer ${token}` } : {}),
  }

  let response: Response
  try {
    response = await globalThis.fetch(url, { method: 'GET', headers, signal: controller.signal })
  } catch {
    cleanup()
    if (controller.signal.aborted) {
      return err(signal?.aborted === true ? { kind: 'aborted' } : { kind: 'timeout' })
    }
    return err({ kind: 'network' })
  }
  cleanup()

  if (!response.ok) {
    // Corpo de erro é JSON/texto (envelope do core-api), não os bytes do documento.
    const text = await response.text()
    let body: unknown = text === '' ? null : text
    try {
      body = JSON.parse(text) as unknown
    } catch {
      /* mantém texto cru */
    }
    return err({ kind: 'http', status: response.status, body })
  }

  try {
    const buffer = await response.arrayBuffer()
    return ok({
      bytes: new Uint8Array(buffer),
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
      fileName: parseFileName(response.headers.get('content-disposition')),
    })
  } catch {
    return err({ kind: 'parse' })
  }
}
