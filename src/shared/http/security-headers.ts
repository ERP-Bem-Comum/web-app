/**
 * Security headers + CSP — builder PURO (testável; sem efeito colateral). FR-001/002/003.
 * Quem APLICA é o middleware global em `src/start.ts` (composition root) via `setResponseHeaders`.
 *
 * Decisões (research R2 + correção ADR-0006):
 * - `script-src 'self' 'nonce-<n>'`: o TanStack Start injeta um `<script>` INLINE de bootstrap
 *   (`window.$_TSR`, dehydrated state) — `'self'` NÃO cobre inline, então a hidratação quebrava. No
 *   router 1.170 `<Scripts/>`/`<ScriptOnce/>` aplicam `router.options.ssr.nonce` nesse inline; o nonce
 *   per-request (`#external/http/csp-nonce.ts`) libera só o nosso bootstrap, sem `'unsafe-inline'`.
 * - `style-src 'self' 'unsafe-inline'` (SEM nonce de propósito): pela regra CSP3 um nonce DESATIVA o
 *   `'unsafe-inline'` da diretiva, e o `style-src` ainda depende dele (vanilla-extract/Vite injetam
 *   `<style>` por JS em dev). Endurecer com nonce em style-src é follow-up (exige carimbar esses estilos).
 * - HSTS só em https (R1/trust-proxy): em dev http omitir para não "travar" localhost.
 * - COOP/CORP `same-origin` + `Permissions-Policy` + `Cache-Control: no-store` (D6 / amenda ADR-0006,
 *   feature 035): isolamento cross-origin (OWASP Secure Headers/XS-Leaks) e respostas do BFF não-cacheáveis.
 *   `X-XSS-Protection` permanece OMITIDO (OWASP: `0`/omitir). Sem CORS (invariante same-origin — FR-012/029).
 */

export type CspDirectives = Readonly<Record<string, readonly string[]>>

/** Política CSP baseline (R2). Ordem estável → serialização determinística. */
export const CSP_BASELINE: CspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'"], // sem unsafe-inline (scripts de hidratação são same-origin)
  'style-src': ["'self'", "'unsafe-inline'"], // endurecer via ssr.nonce (follow-up)
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"], // browser só fala com o BFF
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  // Preview de PDF: o BFF entrega os bytes (same-origin) e o client cria um `blob:` para o <iframe>.
  // Sem `frame-src`, o framing do `blob:` cai no `default-src 'self'` e é bloqueado (ADR-0006). Liberamos
  // só `'self'` + `blob:` (o blob é gerado pelo nosso próprio JS a partir de bytes same-origin).
  'frame-src': ["'self'", 'blob:'],
  'frame-ancestors': ["'none'"], // anti-clickjacking
  'form-action': ["'self'"],
} as const

/**
 * HTTPS a partir do header `x-forwarded-proto` (injetado pelo Caddy — trust-proxy, research R1).
 * Puro/testável; o middleware lê o header do request e delega aqui. Ausente/qualquer-coisa ≠ 'https' → false
 * (em dev http localhost → HSTS omitido).
 */
export const isHttpsFromForwardedProto = (proto: string | null | undefined): boolean =>
  proto === 'https'

/**
 * Adiciona `'nonce-<nonce>'` ao `script-src` (preserva `'self'` e as demais diretivas). Puro/imutável.
 * NÃO toca `style-src`: pela regra CSP3 um nonce desativa o `'unsafe-inline'` da diretiva — e o
 * `style-src` ainda depende dele (estilos injetados por JS em dev). Ver cabeçalho do arquivo.
 */
export const cspWithScriptNonce = (directives: CspDirectives, nonce: string): CspDirectives => ({
  ...directives,
  'script-src': [...(directives['script-src'] ?? []), `'nonce-${nonce}'`],
})

/** Serializa diretivas CSP em `"k v v; k2 v2"` (determinístico — ordem das chaves preservada). */
export const serializeCsp = (directives: CspDirectives): string =>
  Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')

/** Um header de resposta como tupla `[nome, valor]` (imutável). */
export type SecurityHeader = readonly [name: string, value: string]
export type SecurityHeaderSet = readonly SecurityHeader[]

/** Valor do HSTS: 2 anos, subdomínios, preload. */
const HSTS_VALUE = 'max-age=63072000; includeSubDomains; preload'

/**
 * Permissions-Policy — desliga APIs de browser que o ERP não usa (defesa em profundidade, D6/ADR-0006).
 * `()` = nenhum origin pode usar; `(self)` = só a própria origem. Ajustar se uma feature passar a precisar.
 */
const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'autoplay=()',
  'camera=()',
  'display-capture=()',
  'encrypted-media=()',
  'fullscreen=(self)',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=()',
  'usb=()',
].join(', ')

/**
 * Conjunto de headers de segurança para TODA resposta. `https` controla a emissão do HSTS.
 * `nonce` (per-request) habilita o inline de bootstrap do Start em `script-src`. `csp` permite
 * sobrescrever a política inteira (default: `CSP_BASELINE`, com nonce em script-src se fornecido).
 */
export const buildSecurityHeaders = (
  opts: Readonly<{ https: boolean; nonce?: string; csp?: string }>,
): SecurityHeaderSet => {
  const directives = opts.nonce ? cspWithScriptNonce(CSP_BASELINE, opts.nonce) : CSP_BASELINE
  const csp = opts.csp ?? serializeCsp(directives)
  const base: SecurityHeader[] = [
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'DENY'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    // Isolamento cross-origin (OWASP Secure Headers / XS-Leaks — D6/ADR-0006). same-origin: front+BFF.
    ['Cross-Origin-Opener-Policy', 'same-origin'],
    ['Cross-Origin-Resource-Policy', 'same-origin'],
    ['Permissions-Policy', PERMISSIONS_POLICY],
    // Respostas do BFF (SSR + server fns) carregam dado sensível → não cachear (OWASP). Os assets
    // estáticos (hash no nome) são servidos FORA deste middleware, então seguem cacheáveis.
    ['Cache-Control', 'no-store'],
    ['Content-Security-Policy', csp],
  ]
  return opts.https ? [...base, ['Strict-Transport-Security', HSTS_VALUE]] : base
}
