# ADR-0006 — Security Headers & CSP (middleware global + Caddy)

**Status**: Aceito · **Data**: 2026-05-30 · **Contexto**: spec `003-auth-security-hardening`

## Contexto

A auditoria OWASP da Auth (003) confirmou que **nenhum security header** existia no v2 (`src/` nem `Caddyfile`). A constituição (§ Technology Constraints) já manda "CSP/HSTS/nosniff/frame-deny **via middleware**".

## Decisão

1. **Duas camadas de headers**:
   - **Middleware global do TanStack Start** (`src/start.ts` via `createStart({ requestMiddleware })`) — carimba toda resposta (SSR + server functions) com `setResponseHeader`. É a fonte da CSP dinâmica.
   - **Caddy** (borda) — headers estáticos redundantes (defesa em camadas); cobre respostas que não passam pelo app.

2. **Builder puro** em `src/shared/http/security-headers.ts` (`buildSecurityHeaders`, `serializeCsp`, `CSP_BASELINE`, `isHttpsFromForwardedProto`) — testável por `node:test`, sem efeito colateral. Aplicação fica no middleware.

3. **CSP `script-src 'self'` (sem `nonce` em scripts)** — no Start 1.168 **não há suporte a `nonce` nos `<script>` de hidratação** injetados por `<Scripts/>`. Como esses scripts são same-origin, `'self'` os cobre e satisfaz o FR-003 ("sem `unsafe-inline` em `script-src`"). O nonce nativo (`ssr.nonce`) fica **reservado a `<style>`** (CSS inlining) como follow-up. `style-src` mantém `'unsafe-inline'` no baseline.

4. **HSTS condicional (trust-proxy)** — emitido só quando `x-forwarded-proto: https` (injetado pelo Caddy). Em `pnpm dev` puro (http) é omitido para não travar localhost. O header só é confiável atrás do proxy; forjá-lo apenas suprime o próprio HSTS do atacante (não escala acesso).

5. **CSRF re-registrado** — criar `src/start.ts` **desativa** o CSRF automático do Start; re-registramos `createCsrfMiddleware({ filter: ctx => ctx.handlerType === 'serverFn' })`. Complementa o `csrf-origin.ts` (validação de origem aplicada em login e logout).

## Consequências

- ✅ Toda resposta carrega headers de segurança; CSP bloqueia script inline injetado.
- ✅ Zero dependências novas (Web Crypto / API do Start).
- ⚠️ `style-src 'unsafe-inline'` permanece até endurecermos com `ssr.nonce` (follow-up registrado).
- ⚠️ A confiança no `x-forwarded-proto` pressupõe o Caddy como único exposto (arquitetura atual).

## Referências

- `specs/003-auth-security-hardening/research.md` (R1, R2)
- `specs/003-auth-security-hardening/contracts/security-headers.md`
- Supersedido por: — · Refina: ADR-0004 (composition root)
