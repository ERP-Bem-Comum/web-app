# Quickstart & Runbook de Verificação Manual — Auth Security Hardening

Guia para **verificar manualmente** os controles, mapeado a OWASP WSTG/ASVS. Cada caso tem: passos → resultado esperado → o que mapeia (FR/BE-REC) → status a preencher.

> **Como usar**: suba o app (`pnpm dev` em `http://localhost:3000`, ou stack dockerizado em `https://app.localhost`). Para HSTS/HTTPS, use o stack dockerizado. Ferramentas: `curl`, DevTools (Network/Application), opcional Burp/ZAP.
>
> **Status**: `✅ pass` · `❌ fail` · `🔵 n-a-backend` (depende de BE-REC, não corrigível no v2).

---

## A. Security Headers & CSP (cap. 9–11)

### RB-HDR-01 — Headers obrigatórios presentes (FR-001)
```bash
curl -sI http://localhost:3000/ | grep -iE 'x-content-type-options|x-frame-options|referrer-policy'
```
**Esperado**: `nosniff`, `DENY`, `strict-origin-when-cross-origin`. **Status**: ____

### RB-HDR-02 — CSP estrita, sem unsafe-inline em script (FR-003)
```bash
curl -sI http://localhost:3000/login | grep -i content-security-policy
```
**Esperado**: contém `script-src 'self'` **sem** `unsafe-inline`; `frame-ancestors 'none'`; `object-src 'none'`. **Status**: ____

### RB-HDR-03 — HSTS em HTTPS (FR-002)
```bash
curl -sI https://app.localhost/ | grep -i strict-transport-security
```
**Esperado**: `max-age=…; includeSubDomains` (no stack dockerizado). Em http dev: **ausente** (ok). **Status**: ____

### RB-HDR-04 — Headers também em resposta de server function
Faça um login pelo app com DevTools→Network aberto; inspecione a resposta da chamada POST (server fn).
**Esperado**: mesmos headers de segurança presentes. **Status**: ____

### RB-HDR-05 — Clickjacking
Crie um HTML local com `<iframe src="http://localhost:3000/login">`.
**Esperado**: o navegador **bloqueia** o frame (X-Frame-Options/frame-ancestors). **Status**: ____

---

## B. Sessão & Cookie (cap. 5)

### RB-SESS-01 — Flags do cookie (FR-006)
DevTools → Application → Cookies, após login.
**Esperado**: `__Host-session` com `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`; **sem** `Max-Age` se "lembrar dispositivo" desmarcado. **Status**: ____

### RB-SESS-02 — Anti-fixation (FR-004)
Antes do login, force um cookie `__Host-session=fixo123` (DevTools). Faça login.
**Esperado**: o valor do cookie **muda** (novo sessionId crypto-random); o `fixo123` não dá acesso. **Status**: ____

### RB-SESS-03 — Logout invalida server-side (FR-005)
Copie o valor do cookie de sessão. Faça logout. Restaure o cookie antigo e tente uma ação autenticada.
**Esperado**: acesso negado → `auth:expired` / redirect a `/login`. **Status**: ____

### RB-SESS-04 — Expiração (FR-007)
Aguarde além do TTL (ou force `expiresAt` no passado em ambiente de teste) e acesse rota protegida.
**Esperado**: cai em `auth:expired`; entrada removida do store no acesso. **Status**: ____

### RB-SESS-05 — Entropia do sessionId (cap. 5)
Colete vários sessionIds (logins repetidos).
**Esperado**: opacos, sem padrão sequencial/previsível (crypto-random). **Status**: ____

---

## C. Bypass / Guard / Verbo (cap. 3)

### RB-GUARD-01 — Forced browsing (FR-008)
Sem cookie, acesse direto `http://localhost:3000/_authenticated/dashboard` (ou rota protegida real).
**Esperado**: redirect para `/login?redirect=…` preservando o destino. **Status**: ____

### RB-GUARD-02 — Open redirect no retorno (FR-014)
Acesse `/login?redirect=//evil.com` e `/login?redirect=https://evil.com`; faça login.
**Esperado**: pós-login **não** vai para domínio externo (cai em rota interna segura via `safeRedirect`). **Status**: ____

### RB-GUARD-03 — Server fn sem sessão, qualquer verbo (FR-009)
Chame uma server fn autenticada sem cookie (DevTools/curl), GET e POST.
**Esperado**: `auth:expired`, sem vazar dados; nenhum verbo contorna. **Status**: ____

### RB-GUARD-04 — Cobertura de guard (FR-010)
Rode `pnpm test` (inclui `guard-coverage.test.ts`).
**Esperado**: passa; e **falha** se uma rota de conteúdo for criada fora de `_authenticated/` sem entrar na allowlist. **Status**: ____

---

## D. CSRF & Token Leak (cap. 9–10)

### RB-CSRF-01 — Origem cross-site rejeitada (FR-011)
Replique um POST de mutação (ex.: logout) com `Origin: https://evil.com` (curl/Burp).
**Esperado**: rejeitado antes de efeito (`isSameOriginRequest` + middleware CSRF do Start). **Status**: ____

### RB-LEAK-01 — Token nunca no browser (FR-012)
Após login: DevTools → procure por `accessToken`/`refresh`/`CORE_API_URL` em: JS, `localStorage`, `sessionStorage`, estado, payloads de Network. `pnpm build` e `grep` no bundle client.
**Esperado**: **nada** encontrado — só o cookie opaco `__Host-session`. **Status**: ____

---

## E. Enumeration (cap. 2)

### RB-ENUM-01 — Mensagem uniforme (FR-013)
Tente login com email inexistente e com email válido + senha errada.
**Esperado**: **mesma** tag/mensagem, mesmo status e forma de resposta (indistinguível). **Status**: ____

### RB-ENUM-02 — Timing (🔵 BE-REC-002)
Meça o tempo de resposta de email inexistente vs. existente+senha errada (Burp/`curl -w`).
**Esperado hoje**: pode haver diferença (backend retorna antes do hash). **Registrar como `n-a-backend`** → BE-REC-002. **Status**: ____

---

## F. Itens dependentes de backend (registrar, não testar no v2)

| Caso | OWASP | Recomendação |
|------|-------|--------------|
| RB-RATE-01 — brute force / spraying no login | cap. 7 | 🔵 BE-REC-001 |
| RB-RESET-01 — fluxo de reset de senha | cap. 6 | 🔵 BE-REC-003 (inexistente) |
| RB-ENUM-02 — timing | cap. 2 | 🔵 BE-REC-002 |

> Detalhes e justificativa em [`backend-recommendations.md`](./backend-recommendations.md).

---

## Quality gate (antes de fechar a feature)

```bash
pnpm lint        # boundaries server/client + MVVM
pnpm typecheck   # tsc --noEmit
pnpm test        # node:test (security-headers, guard-coverage, sessão)
pnpm test:dom    # vitest (se houver caso de UI)
pnpm build       # produção + grep anti-leak no bundle
```
Todos verdes + todos os casos do runbook com status preenchido = feature pronta (SC-001..SC-008).
