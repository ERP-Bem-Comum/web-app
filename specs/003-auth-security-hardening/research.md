# Research: Auth Security Hardening (Phase 0)

Decisões técnicas que destravam o plano. Fontes: `tanstack-start-expert` (sobre `handbook/reference/tanstack-start/`), `core-api-consultant` (backend), e inspeção do `src/` atual.

---

## R1 — Onde aplicar os security headers

**Decisão**: **duas camadas** — (a) estáticos no **Caddy** (borda) e (b) transversais via **global request middleware** do TanStack Start em `src/start.ts`.

**Rationale**:
- A constituição manda "CSP/HSTS/nosniff/frame-deny **via middleware**" (§ Technology Constraints). O middleware global do Start carimba **toda** resposta — SSR e server functions — e viaja com o app (dev, docker, prod).
- Caddy adiciona defesa em camadas e cobre respostas que não passam pelo app (assets estáticos), mas sozinho não cobre `pnpm dev` puro nem CSP dinâmica → não basta.
- Tech Lead escolheu "ambos".

**API confirmada (Start 1.168)**:
- `src/start.ts`: `export const startInstance = createStart(() => ({ requestMiddleware: [securityHeadersMw, csrfMw] }))`.
- `createMiddleware().server(({ next, request }) => { setResponseHeader(...); return next() })` — `request` é `Request` (Web Fetch).
- Global request middleware "runs before every request, including server routes, SSR and server functions" (`guide/middleware.md`).
- Helpers de `@tanstack/react-start/server`: `getRequest()`, `getRequestHeader(name)`, `setResponseHeader(name,value)`, `setResponseHeaders(Headers)`, `setResponseStatus(code)`.

**⚠️ Efeito colateral (CSRF)**: criar `src/start.ts` **desativa** o CSRF middleware automático do Start (passa a emitir warning). **Obrigatório** re-registrar `createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === 'serverFn' })` no `requestMiddleware`. Isso complementa (não substitui) o `csrf-origin.ts` já existente.

**Alternativas rejeitadas**: só Caddy (não cobre dev nem CSP-nonce; foge da constituição); só `src/server.ts` entry handler (mais baixo nível que o necessário; middleware é o idiomático).

**Trust-proxy & HTTPS detection (resolve C2/I1 do /speckit-analyze)**:
- **Premissa de trust-proxy**: em produção/docker o **Caddy é o único exposto** e termina TLS; o `web` (BFF) só recebe tráfego do Caddy. Logo o BFF **pode** confiar no `x-forwarded-proto` que o Caddy injeta — mas **somente** porque está atrás de um proxy confiável. Em `pnpm dev` puro (sem Caddy) não há esse header → tratamos como **http** (HSTS omitido, correto p/ localhost).
- **Edge case "header forjável"**: o `x-forwarded-proto` só é confiável atrás do Caddy. Se o BFF um dia for exposto direto, essa premissa quebra. Mitigação: a decisão de HTTPS afeta **apenas emitir/omitir HSTS** (header de hardening) — um atacante forjando `x-forwarded-proto: http` só conseguiria **suprimir** o próprio HSTS dele, não escalar acesso. Risco baixo e contido; documentado aqui.
- **Redirect HTTP→HTTPS (FR-002)**: garantido pelo **Caddy** — o site `app.localhost` com `tls internal` já faz o redirect 308 HTTP→HTTPS por padrão (comportamento nativo do Caddy). O BFF não precisa redirecionar; a verificação entra no runbook (RB-HDR-03). Em dev puro (http) não há HTTPS para redirecionar — aceitável.

---

## R2 — CSP estrita e o problema do nonce nos scripts

**Decisão**: CSP estrita **sem `unsafe-inline` em `script-src`**, usando **`script-src 'self'`** (não nonce-em-script). Nonce nativo (`ssr.nonce`) fica **reservado a `<style>`** (CSS inlining), a ser validado quando houver estilos inline.

**Rationale (achado crítico da pesquisa)**:
- No Start 1.168, **`<Scripts/>`/`<HeadContent/>` NÃO têm suporte documentado a `nonce`** para os scripts de hidratação. A única menção a nonce nativo é `ssr.nonce` no router, que aplica nonce a `<style>` via `HeadContent` (`guide/css-styling.md`) — **não** aos `<script>`.
- Logo, "CSP estrita com nonce cobrindo os scripts" **não é viável nativamente** nesta versão. Forçar isso exigiria patch/entry-handler frágil.
- Os scripts de hidratação do Start são servidos **same-origin** → `script-src 'self'` os cobre **sem** `unsafe-inline`, satisfazendo o **FR-003** ("sem `unsafe-inline` para `script-src`").

**CSP proposta (baseline)**:
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';   # rever p/ nonce via ssr.nonce se houver CSS inline crítico
img-src 'self' data:;
font-src 'self';
connect-src 'self';
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
form-action 'self';
```
> `style-src` mantém `'unsafe-inline'` no baseline porque o app/SSR pode emitir estilos inline; **endurecer depois** com `ssr.nonce` (item de follow-up). Scripts já entram estritos.

**Alternativas rejeitadas**: nonce-em-script (sem suporte nativo); `unsafe-inline` em script (viola FR-003); CSP só report-only (não bloqueia — pode vir como etapa de rollout).

**Follow-up**: validar assinatura exata de `ssr.nonce` contra os tipos do pacote instalado antes de endurecer `style-src`.

---

## R3 — Session fixation: estado atual já mitiga

**Decisão**: tratar anti-fixation como **verificação + teste de regressão** (não reconstrução), com reforço explícito de "descartar id anterior".

**Rationale (inspeção do código)**:
- `login.use-case.ts` **já** gera um **novo** `sessionId` via `deps.genId()` a cada login e grava no store.
- O v2 **não cria sessão anônima**: o cookie `__Host-session` só nasce **após** login bem-sucedido (`login.server-fn.ts` seta o Set-Cookie só no sucesso). Não há "sessão pré-login" para ser fixada.
- Portanto o vetor clássico (atacante planta um sessionId, vítima loga, id permanece) **já está fechado**: qualquer id pré-existente é substituído pelo novo `genId()` e o cookie é reescrito.

**Ação**: teste que confirma `sessionId` pós-login ≠ qualquer valor anterior; e confirmação de que `genId()` usa fonte crypto (entropia). Sem mudança de arquitetura.

---

## R4 — Logout, expiração e flags de cookie: auditar o existente

**Decisão**: **auditar + testar**, não reimplementar.

**Rationale (código)**:
- `logout.server-fn.ts`: lê cookie → recupera refresh do store → `logout` use-case (revoga no core-api + `store.delete`) → `clearSessionCookieHeader()`. Idempotente. ✔ atende FR-005.
- `session-store.memory.ts`: `get()` remove entrada expirada (`now >= expiresAt`) e retorna `expired`. ✔ atende FR-007.
- `cookie.ts`: `__Host-session`, `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, `Max-Age` só se `persistent`. ✔ atende FR-006.

**Ação**: testes de regressão (reuso de cookie pós-logout → `auth:expired`; entropia/opacidade do id; `Max-Age` ausente sem rememberDevice) + checagem no runbook.

---

## R5 — Guard completo (sem rota órfã)

**Decisão**: manter `_authenticated/` + server fns validando sessão; adicionar **teste de cobertura de guard**.

**Rationale**:
- `_authenticated/route.tsx` faz `beforeLoad` → `getCurrentUserFn()` → sem sessão → `redirect /login?redirect=`. Server fns autenticadas resolvem sessão via `session.guard`.
- Risco real = **rota nova nascer fora de `_authenticated/`** sem guard. Mitigação automatizável: teste que varre `src/routes/` e falha se uma rota "de conteúdo" estiver fora do layout protegido (allowlist explícita p/ públicas: `index`, `login`, `health`).

**Ação**: `tests/routes/guard-coverage.test.ts` (node:test) com allowlist de rotas públicas.

---

## R6 — CSRF de origem em todas as mutações

**Decisão**: estender `isSameOriginRequest` (já em `login.server-fn`) a **todas** as server fns de mutação; o middleware CSRF do Start (R1) é a segunda camada.

**Rationale**: `csrf-origin.ts` valida `Sec-Fetch-Site`/`Origin`×`Host`. Hoje aplicado no login; logout e futuras mutações devem usar o mesmo helper. Complementa `SameSite=Strict`.

**Ação**: aplicar em `logout.server-fn` (e padrão para futuras); teste de rejeição cross-site.

---

## R7 — Rate-limit no BFF: adiado

**Decisão**: **não implementar** nesta feature. Permanece como **BE-REC-001** (backend).

**Rationale**: o lugar correto é o core-api (lockout por conta + limite por IP com store compartilhado). Mitigação no BFF seria in-memory (zera no restart, não distribuída) — custo/benefício ruim agora. Tech Lead optou por adiar. **US5/FR-015 saem do escopo de implementação** (ficam documentados).

---

## R8 — Recomendações ao backend (consolidado)

Já documentadas em [`backend-recommendations.md`](./backend-recommendations.md): BE-REC-001 (rate-limit/lockout), 002 (dummy-hash/timing), 003 (reset de senha), 004 (expor changePassword/revokeAllSessions), 005 (blocklist de senhas vazadas). Verificadas via `core-api-consultant`. **Fora do escopo de implementação** desta feature.

---

## Itens NEEDS CLARIFICATION restantes

Nenhum. As 2 decisões abertas (local dos headers / rate-limit) foram resolvidas pelo Tech Lead; o impedimento técnico (nonce em scripts) foi resolvido em R2 com a alternativa suportada.
