# Contract: Security Response Headers

**Onde**: toda resposta HTTP do BFF (SSR + server functions), via global request middleware (`src/start.ts`) + reforço estático no Caddy.

**Quem consome**: o navegador. Verificável por `curl -I` / DevTools.

---

## Headers obrigatórios (toda resposta)

| Header | Valor esperado | FR |
|--------|----------------|----|
| `X-Content-Type-Options` | `nosniff` | FR-001 |
| `X-Frame-Options` | `DENY` | FR-001 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | FR-001 |
| `Content-Security-Policy` | ver abaixo | FR-003 |

## Headers condicionais (HTTPS/produção)

| Header | Valor esperado | FR |
|--------|----------------|----|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | FR-002 |

> Em `pnpm dev` (http localhost) o HSTS é **omitido** (não travar localhost). No stack dockerizado (Caddy TLS) ele aparece.

## Content-Security-Policy (baseline)

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
```

**Invariantes**:
- `script-src` **NÃO** contém `'unsafe-inline'` nem `'unsafe-eval'`.
- `frame-ancestors 'none'` presente (anti-clickjacking).
- `object-src 'none'` e `base-uri 'self'` presentes.
- `connect-src 'self'` (browser só fala com o BFF — o `core-api` nunca é chamado do browser).

> `style-src 'unsafe-inline'` é tolerado no baseline; follow-up endurece via `ssr.nonce` (R2).

---

## Critérios de aceite (testáveis)

1. `GET /` e `GET /login` retornam **todos** os headers obrigatórios com os valores acima.
2. Resposta de uma **server function** (POST) também carrega os headers (middleware é global).
3. `Content-Security-Policy` de qualquer resposta **não** casa com regex `script-src[^;]*unsafe-inline`.
4. Em ambiente HTTPS, `Strict-Transport-Security` presente; em http dev, ausente.
5. Tentativa de embutir em `<iframe>` cross-origin é bloqueada pelo navegador (`X-Frame-Options`/`frame-ancestors`).

## Teste automatizado (unit)

`tests/shared/http/security-headers.test.ts` (node:test) sobre o builder puro:
- `buildSecurityHeaders({ https: true, csp })` inclui HSTS; `{ https: false }` omite.
- `serializeCsp(directives)` produz string sem `unsafe-inline` em `script-src`.
- conjunto contém `nosniff`, `DENY`, `Referrer-Policy`.
