/**
 * request_id por-request (correlação — D8/ADR-0019). I/O de request → camada external/. Espelha
 * `csp-nonce.ts`: publicado no request-scope (`h3Event`) via `createIsomorphicFn`; lido em server fns e
 * no logger no MESMO request. NUNCA vaza no bundle client — a impl `.server()` (que toca
 * `@tanstack/react-start/server`, negado no client) some no build do cliente por DCE (execution-model).
 *
 * O `request_id` é o **reference id** de correlação: emitido como header de resposta `X-Request-Id`
 * (src/start.ts) e logado nos erros da borda — permite triagem rápida sem vazar detalhe (OWASP Error
 * Handling: genérico ao usuário, detalhe no servidor). NÃO é segredo (não é censurado pelo `redact`).
 */
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest, getRequestHeader } from '@tanstack/react-start/server'

/** Header padrão de correlação — entrada (do edge) e saída (na resposta). */
export const REQUEST_ID_HEADER = 'x-request-id'

/** Deriva o id: honra um `X-Request-Id` de entrada (edge/Caddy) ou gera UUID v4 nativo (Web Crypto). */
export const deriveRequestId = createIsomorphicFn()
  .server((): string => getRequestHeader(REQUEST_ID_HEADER) ?? crypto.randomUUID())
  .client((): string => crypto.randomUUID())

/** Publica o id no request-scope (`h3Event`) para server fns/logger lerem no mesmo request. */
export const setRequestId = createIsomorphicFn()
  .server((id: string): void => {
    getRequest().headers.set(REQUEST_ID_HEADER, id)
  })
  .client((_id: string): void => undefined)

/**
 * Lê o `request_id` do request-scope. Server: do `h3Event`. Client: `undefined`.
 * **Best-effort: NUNCA lança** — é chamado de pontos de log de erro que podem rodar FORA de um request
 * (boot, testes, jobs); fora do escopo de request, retorna `undefined` em vez de quebrar o caminho de erro.
 */
export const getRequestId = createIsomorphicFn()
  .server((): string | undefined => {
    try {
      return getRequestHeader(REQUEST_ID_HEADER)
    } catch {
      return undefined
    }
  })
  .client((): undefined => undefined)
