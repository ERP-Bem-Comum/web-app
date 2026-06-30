/**
 * resultFetch — fetch nativo → Result<T, HttpError>. NUNCA lança ao chamador.
 * Timeout + cancelamento via AbortController. `token?` opcional (sessão real é da
 * feature Auth). Base: globalThis.fetch (constituição §VIII — preferir nativo).
 * Fonte do padrão: handbook/arquiteture.md §2.
 */
import type { HttpError } from '#shared/http/http-error.types.ts'
import { ok, err, type Result } from '#shared/primitives/result.ts'
import { logger } from '#external/logging/logger.ts'
import { getRequestId } from '#external/http/request-id.ts'

export type ResultFetchOptions = Readonly<{
  method?: string
  token?: string
  body?: unknown
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

/**
 * resultFetchText — variante p/ endpoints que respondem TEXTO cru (ex.: export OFX/CSV do core-api,
 * que NÃO é JSON). Mesmo contrato de erro/timeout do `resultFetch`, mas devolve o body como string sem
 * tentar `JSON.parse`. Envia accept curinga (não força application/json).
 */
export const resultFetchText = async (
  url: string,
  options: ResultFetchOptions = {},
): Promise<Result<string, HttpError>> => {
  const { method = 'GET', token, headers = {}, signal, timeoutMs = 15_000 } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)
  if (signal) {
    if (signal.aborted) controller.abort()
    else {
      signal.addEventListener(
        'abort',
        () => {
          controller.abort()
        },
        { once: true },
      )
    }
  }

  const requestHeaders: Record<string, string> = {
    accept: '*/*',
    ...(token !== undefined ? { authorization: `Bearer ${token}` } : {}),
    ...headers,
  }

  let response: Response
  try {
    response = await globalThis.fetch(url, { method, headers: requestHeaders, signal: controller.signal })
  } catch (cause) {
    clearTimeout(timeoutId)
    if (controller.signal.aborted) {
      return err(signal?.aborted === true ? { kind: 'aborted' } : { kind: 'timeout' })
    }
    logger.error({ err: cause, url, method, request_id: getRequestId() }, 'core-api-fetch:network-error')
    return err({ kind: 'network' })
  }
  clearTimeout(timeoutId)

  if (!response.ok) {
    return err({ kind: 'http', status: response.status, body: await safeReadBody(response) })
  }
  return ok(await response.text())
}

export const resultFetch = async <T>(
  url: string,
  options: ResultFetchOptions = {},
): Promise<Result<T, HttpError>> => {
  const { method = 'GET', token, body, headers = {}, signal, timeoutMs = 10_000 } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)
  if (signal) {
    if (signal.aborted) controller.abort()
    else {
      signal.addEventListener(
        'abort',
        () => {
          controller.abort()
        },
        { once: true },
      )
    }
  }

  const requestHeaders: Record<string, string> = {
    accept: 'application/json',
    ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    ...(token !== undefined ? { authorization: `Bearer ${token}` } : {}),
    ...headers,
  }

  let response: Response
  try {
    response = await globalThis.fetch(url, {
      method,
      headers: requestHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    })
  } catch (cause) {
    clearTimeout(timeoutId)
    if (controller.signal.aborted) {
      return err(signal?.aborted === true ? { kind: 'aborted' } : { kind: 'timeout' })
    }
    logger.error({ err: cause, url, method, request_id: getRequestId() }, 'core-api-fetch:network-error')
    return err({ kind: 'network' })
  }
  clearTimeout(timeoutId)

  if (!response.ok) {
    return err({ kind: 'http', status: response.status, body: await safeReadBody(response) })
  }
  if (response.status === 204) {
    // 204 No Content: sucesso sem corpo. `as T` documentado — chamador tipa T como void/undefined.
    return ok(undefined as T)
  }
  // Alguns endpoints respondem 2xx COM corpo vazio (ex.: PUT /…/:id, deactivate/reactivate do core-api
  // retornam 200 sem body). Tratamos como sucesso sem conteúdo — o chamador refaz o GET quando precisa.
  const text = await response.text()
  if (text === '') return ok(undefined as T)
  try {
    // Boundary: o response do backend é validado por Zod no schema do módulo; aqui o cast é o ponto único.
    return ok(JSON.parse(text) as T)
  } catch (cause) {
    logger.error({ err: cause, url, method, request_id: getRequestId() }, 'core-api-fetch:json-parse-error')
    return err({ kind: 'parse' })
  }
}
