/**
 * Security headers + CSP — builder PURO (testável; sem efeito colateral). FR-001/002/003.
 * Quem APLICA é o middleware global em `src/start.ts` (composition root) via `setResponseHeaders`.
 *
 * Decisões (research R2):
 * - `script-src 'self'` (SEM `unsafe-inline`): no TanStack Start 1.168 NÃO há suporte a `nonce` nos
 *   `<script>` de hidratação injetados por `<Scripts/>`. Como esses scripts são same-origin, `'self'`
 *   os cobre e ainda satisfaz o FR-003 ("sem unsafe-inline em script-src"). Nonce nativo (`ssr.nonce`)
 *   fica reservado a `<style>` (CSS inlining) — follow-up.
 * - `style-src 'unsafe-inline'` é tolerado no baseline (SSR pode emitir estilo inline); endurecer depois.
 * - HSTS só em https (R1/trust-proxy): em dev http omitir para não "travar" localhost.
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
 * Conjunto de headers de segurança para TODA resposta. `https` controla a emissão do HSTS.
 * `csp` permite sobrescrever a política (default: `CSP_BASELINE`).
 */
export const buildSecurityHeaders = (
  opts: Readonly<{ https: boolean; csp?: string }>,
): SecurityHeaderSet => {
  const csp = opts.csp ?? serializeCsp(CSP_BASELINE)
  const base: SecurityHeader[] = [
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'DENY'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['Content-Security-Policy', csp],
  ]
  return opts.https ? [...base, ['Strict-Transport-Security', HSTS_VALUE]] : base
}
