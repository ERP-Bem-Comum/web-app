/**
 * Start instance (composition root do BFF) — registra MIDDLEWARE GLOBAL de request.
 * Roda antes de TODA request: SSR, server routes e server functions (TanStack Start 1.168).
 *
 * Por que este arquivo existe (003 — auth security hardening):
 * 1. `securityHeadersMiddleware` — carimba os headers de segurança (FR-001/002/003) em toda resposta.
 *    Defesa em camadas: o Caddy também seta headers estáticos na borda; a CSP dinâmica fica aqui.
 * 2. `csrfMiddleware` — ⚠️ criar `src/start.ts` DESATIVA o CSRF automático do Start. Precisamos
 *    re-registrá-lo explicitamente (senão server functions ficam sem a proteção nativa + warning em dev).
 *
 * HTTPS detection (research R1 — trust-proxy): lemos `x-forwarded-proto` que o Caddy injeta. Só é
 * confiável atrás do proxy (em prod/docker o Caddy é o único exposto). Em `pnpm dev` puro o header não
 * existe → tratamos como http → HSTS omitido (correto p/ localhost). Forjar o header só suprimiria o
 * próprio HSTS do atacante — não escala acesso.
 */
import { createStart, createMiddleware, createCsrfMiddleware } from '@tanstack/react-start'
import { getRequestHeader, setResponseHeader } from '@tanstack/react-start/server'

import { buildSecurityHeaders, isHttpsFromForwardedProto } from '#shared/http/security-headers.ts'

const securityHeadersMiddleware = createMiddleware().server(({ next }) => {
  const https = isHttpsFromForwardedProto(getRequestHeader('x-forwarded-proto'))
  for (const [name, value] of buildSecurityHeaders({ https })) {
    setResponseHeader(name, value)
  }
  return next()
})

// Re-registro explícito do CSRF do Start (some ao definirmos src/start.ts). Protege server functions
// validando metadados same-origin (Sec-Fetch-Site/Origin/Referer) — complementa o nosso csrf-origin.ts.
const csrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === 'serverFn' })

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware, csrfMiddleware],
}))
