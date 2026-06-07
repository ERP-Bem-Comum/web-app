# Data Model: Auth Security Hardening (Phase 1)

Esta feature é majoritariamente de **borda/configuração** — poucas entidades de dados, todas imutáveis e tipadas (Constituição §IV/§VII). Nenhuma persiste no `core-api`.

---

## 1. SecurityHeaderSet

Conjunto de cabeçalhos HTTP aplicado a toda resposta do BFF. Builder **puro** (testável) em `shared/http/security-headers.ts`.

| Campo (header) | Valor | Aplicação |
|----------------|-------|-----------|
| `X-Content-Type-Options` | `nosniff` | sempre |
| `X-Frame-Options` | `DENY` | sempre (redundante com CSP `frame-ancestors`) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | sempre |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | só HTTPS/produção |
| `Content-Security-Policy` | ver `ContentSecurityPolicy` | sempre |
| `X-DNS-Prefetch-Control` | `off` | opcional |

**Tipo** (ilustrativo):
```ts
type SecurityHeader = readonly [name: string, value: string]
type SecurityHeaderSet = readonly SecurityHeader[]
const buildSecurityHeaders = (opts: Readonly<{ https: boolean; csp: string }>): SecurityHeaderSet => ...
```

**Regras**:
- `Strict-Transport-Security` **omitido** quando `https=false` (dev http) para não "travar" localhost.
- Imutável (`as const` / `readonly`).
- Sem efeito colateral no builder — quem aplica é o middleware (`setResponseHeaders`).

---

## 2. ContentSecurityPolicy

Política CSP montada a partir de diretivas tipadas (evita string solta).

| Diretiva | Valor baseline | Nota |
|----------|----------------|------|
| `default-src` | `'self'` | base restritiva |
| `script-src` | `'self'` | **sem `unsafe-inline`** (R2; scripts same-origin) |
| `style-src` | `'self' 'unsafe-inline'` | endurecer depois com `ssr.nonce` (follow-up) |
| `img-src` | `'self' data:` | |
| `font-src` | `'self'` | |
| `connect-src` | `'self'` | browser só fala com o BFF |
| `object-src` | `'none'` | |
| `base-uri` | `'self'` | |
| `frame-ancestors` | `'none'` | anti-clickjacking |
| `form-action` | `'self'` | |

**Tipo**:
```ts
type CspDirectives = Readonly<Record<string, readonly string[]>>
const serializeCsp = (d: CspDirectives): string => ...   // "k v v; k2 v2"
```

**Regras**: serialização determinística (ordem estável); valores `readonly`; nenhum `unsafe-inline` em `script-src`.

---

## 3. Session (existente — sem mudança de forma)

Já definida em `server/domain/session/session.types.ts`. Relevante para auditoria (FR-004/005/006/007):

| Campo | Papel na segurança |
|-------|--------------------|
| `sessionId` (branded, opaco) | crypto-random; **novo a cada login** (anti-fixation, R3) |
| `accessExpiresAt` / `refreshExpiresAt` | expiração idle/absoluta (FR-007) |
| `refreshToken` / `accessToken` | **server-side only** — nunca no browser (FR-012) |
| `persistent` | controla `Max-Age` do cookie (FR-006) |

**Sem alteração de schema** — esta feature só **verifica/testa** invariantes.

---

## 4. GuardCoverageRule

Regra de auditoria (não runtime) que define quais rotas podem viver **fora** de `_authenticated/`.

| Campo | Valor |
|-------|-------|
| `publicRoutes` (allowlist) | `['/', '/login', '/health']` |
| `protectedParent` | `/_authenticated` |
| invariante | toda rota não-pública DEVE ser filha de `_authenticated` |

Consumida pelo teste `guard-coverage.test.ts`. Mudou rota pública? Atualiza a allowlist **conscientemente** (o teste força a decisão).

---

## 5. RunbookCase (documental)

Caso de teste manual no runbook (`quickstart.md`). Não é código.

| Campo | Exemplo |
|-------|---------|
| `id` | `RB-SESS-01` |
| `owaspRef` | `WSTG-SESS-03` / ASVS V3 |
| `steps` | passos (curl/DevTools/Burp) |
| `expected` | resultado esperado |
| `mapsTo` | FR-006 / BE-REC-001 |
| `status` | `pass` / `fail` / `n-a-backend` |

---

## Relações

```
SecurityHeaderSet ──contém──> ContentSecurityPolicy
Middleware global (src/start.ts) ──aplica──> SecurityHeaderSet  (toda resposta)
GuardCoverageRule ──audita──> rotas (src/routes/)
RunbookCase ──verifica──> {FR-*, BE-REC-*}
Session (existente) ──invariantes auditadas por──> RunbookCase + testes
```
