# ADR-0006 — Security Headers & CSP (middleware global + Caddy)

**Status**: Aceito (amendado 2026-06-01, 2026-06-09) · **Data**: 2026-05-30 · **Contexto**: spec `003-auth-security-hardening`

> **Amendência 2026-06-01 (CSP nonce):** a Decisão #3 abaixo partia de uma premissa **incorreta** — o
> TanStack Start injeta SIM um `<script>` **inline** de bootstrap (`window.$_TSR`, dehydrated state) que
> `script-src 'self'` NÃO cobre, quebrando a hidratação (página branca). Corrigido: ver "Decisão #3
> (revisada)" e o ADR de detalhe. O `script-src` agora carrega um **nonce per-request**.

## Contexto

A auditoria OWASP da Auth (003) confirmou que **nenhum security header** existia no v2 (`src/` nem `Caddyfile`). A constituição (§ Technology Constraints) já manda "CSP/HSTS/nosniff/frame-deny **via middleware**".

## Decisão

1. **Duas camadas de headers**:
   - **Middleware global do TanStack Start** (`src/start.ts` via `createStart({ requestMiddleware })`) — carimba toda resposta (SSR + server functions) com `setResponseHeader`. É a fonte da CSP dinâmica.
   - **Caddy** (borda) — headers estáticos redundantes (defesa em camadas); cobre respostas que não passam pelo app.

2. **Builder puro** em `src/shared/http/security-headers.ts` (`buildSecurityHeaders`, `serializeCsp`, `CSP_BASELINE`, `isHttpsFromForwardedProto`) — testável por `node:test`, sem efeito colateral. Aplicação fica no middleware.

3. **CSP `script-src 'self'` (sem `nonce` em scripts)** — ~~no Start 1.168 não há suporte a `nonce` nos `<script>` de hidratação injetados por `<Scripts/>`~~. **[REVISADO 2026-06-01]** Premissa errada: o Start injeta um `<script>` **inline** de bootstrap (`window.$_TSR`) que `'self'` não cobre → a hidratação quebrava. Ver **Decisão #3 (revisada)**.

3bis. **Decisão #3 (revisada 2026-06-01) — `script-src 'self' 'nonce-<n>'` com nonce per-request:**
   - O `securityHeadersMiddleware` gera um nonce por request (Web Crypto) e o injeta no `script-src` via `buildSecurityHeaders({ nonce })`. O nonce é publicado no request-scope (`#external/http/csp-nonce.ts`, header de request interno no mesmo `h3Event`) e lido pelo `getRouter()` → `createRouter({ ssr: { nonce } })`.
   - Com `ssr.nonce` setado, o router 1.170 carimba o nonce no `<script>` inline de bootstrap (`<Scripts/>`/`ssr-server`) e o `HeadContent` **auto-emite** `<meta property="csp-nonce">` (uma vez). O cliente do Start reconstrói o nonce dessa `<meta>` na hidratação (`ssr-client`), e o Vite (dev) a usa p/ carimbar seus assets.
   - **`style-src` mantém `'self' 'unsafe-inline'` SEM nonce** de propósito: pela regra CSP3 um nonce **desativa** o `'unsafe-inline'` da diretiva, e o `style-src` ainda depende dele (vanilla-extract/Vite injetam `<style>` por JS em dev). Endurecer `style-src` com nonce é follow-up.
   - `#external/http/csp-nonce.ts` usa `createIsomorphicFn` (a impl `.server()` toca `@tanstack/react-start/server`, negado no client) → o compilador remove esse acesso do bundle client (validado em `pnpm build`, import-protection em `error`).

4. **HSTS condicional (trust-proxy)** — emitido só quando `x-forwarded-proto: https` (injetado pelo Caddy). Em `pnpm dev` puro (http) é omitido para não travar localhost. O header só é confiável atrás do proxy; forjá-lo apenas suprime o próprio HSTS do atacante (não escala acesso).

5. **CSRF re-registrado** — criar `src/start.ts` **desativa** o CSRF automático do Start; re-registramos `createCsrfMiddleware({ filter: ctx => ctx.handlerType === 'serverFn' })`. Complementa o `csrf-origin.ts` (validação de origem aplicada em login e logout).

6. **`frame-src 'self' blob:` (adicionado 2026-06-09) — preview de PDF de documentos de contrato:**
   - A tela de detalhe do contrato pré-visualiza o PDF do documento (contrato/aditivo) num `<iframe>`. O BFF entrega os **bytes** (same-origin, via server-fn) e o client cria um `blob:` (`URL.createObjectURL`) como `src` do iframe.
   - Sem uma diretiva `frame-src`, o framing do `blob:` caía no `default-src 'self'` e era **bloqueado** (iframe abria em branco). Adicionamos `frame-src 'self' blob:` — restrito a same-origin + blob (o blob é gerado pelo nosso próprio JS a partir de bytes same-origin; `script-src` segue travado, sem injeção de blob por terceiros).
   - **Não** abrimos `frame-src` para `http(s)://` externo nem `*` (coberto por teste em `tests/shared/http/security-headers.test.ts`). `frame-ancestors 'none'` (anti-clickjacking) permanece intacto.

## Consequências

- ✅ Toda resposta carrega headers de segurança; CSP bloqueia script inline NÃO-autorizado (só o bootstrap do Start, carimbado com o nonce per-request, é liberado).
- ✅ Zero dependências novas (Web Crypto / API do Start).
- ✅ **[2026-06-01]** Hidratação do TanStack Start funciona sob `script-src` sem `'unsafe-inline'` (nonce per-request); boundary server/client preservada (nada de `react-start/server` no bundle client).
- ⚠️ `style-src 'unsafe-inline'` permanece (nonce em style-src desativaria o `'unsafe-inline'` exigido pelos `<style>` injetados por JS em dev); endurecer é follow-up.
- ⚠️ A confiança no `x-forwarded-proto` pressupõe o Caddy como único exposto (arquitetura atual).

## Referências

- `specs/003-auth-security-hardening/research.md` (R1, R2)
- `specs/003-auth-security-hardening/contracts/security-headers.md`
- Supersedido por: — · Refina: ADR-0004 (composition root)
