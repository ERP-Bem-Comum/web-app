/**
 * CSP nonce per-request (ADR-0006 — correção do follow-up de nonce). I/O de request → camada external/.
 *
 * Fluxo (um único nonce por request):
 * 1. `securityHeadersMiddleware` (src/start.ts) gera o nonce e o publica no request-scope via
 *    `setRequestCspNonce`, e o injeta no header `Content-Security-Policy` (script-src).
 * 2. `getRouter()` (src/app/router.tsx) lê o MESMO nonce via `getRequestCspNonce` → `ssr: { nonce }`.
 *    O `<Scripts/>`/`<ScriptOnce/>` do router carimbam o nonce no `<script>` inline de bootstrap.
 * 3. O `__root` renderiza `<meta property="csp-nonce">`; no cliente o Start reconstrói
 *    `router.options.ssr.nonce` lendo dessa meta (ssr-client) e o Vite (dev) carimba seus assets.
 *
 * O canal (1)→(2) é o MESMO `h3Event` do request (AsyncLocalStorage do Start): o middleware roda antes
 * do `getRouter()`. Usa um header de REQUEST interno — nunca sai na resposta, sem vazamento.
 *
 * `createIsomorphicFn`: o acesso a `@tanstack/react-start/server` (negado no bundle client) fica só na
 * impl `.server()`; o compilador remove a impl + o import no build do cliente. `router.tsx` é isomórfico,
 * então importar deste módulo é seguro.
 */
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest, getRequestHeader } from '@tanstack/react-start/server'

/** Header de request interno que carrega o nonce do middleware até o `getRouter()`. Nunca sai na resposta. */
export const NONCE_REQUEST_HEADER = 'x-tsr-csp-nonce'

/** Gera um nonce base64 de 128 bits via Web Crypto (nativo; sem `Date`/`Math.random`). */
export const generateCspNonce = (): string => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

/** Publica o nonce no request-scope (`h3Event.req.headers`) para o `getRouter()` ler no mesmo request. */
export const setRequestCspNonce = createIsomorphicFn()
  .server((nonce: string): void => {
    getRequest().headers.set(NONCE_REQUEST_HEADER, nonce)
  })
  .client((_nonce: string): void => undefined)

/** Lê o nonce do request-scope. No servidor: do `h3Event`. No cliente: `undefined` (vem da `<meta>`). */
export const getRequestCspNonce = createIsomorphicFn()
  .server((): string | undefined => getRequestHeader(NONCE_REQUEST_HEADER))
  .client((): undefined => undefined)
