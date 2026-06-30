# Phase 0 — Research: Auth

Decisões resolvidas (formato Decisão / Rationale / Alternativas). Contrato do backend **verificado** com
`core-api-consultant` contra o submódulo `core-api@73c2f9b` (branch `dev`).

## R0 — Contrato real do core-api (`/api/v2/auth/*`) — VERIFICADO

| Endpoint | Request | Sucesso | Erros (status · slug) |
|----------|---------|---------|------------------------|
| `POST /api/v2/auth/login` | `{ email, password }` | `200 { accessToken, refreshToken, userId }` | 401 `invalid-credentials` · 403 `user-disabled` · 400 `validation` |
| `POST /api/v2/auth/refresh` | `{ refreshToken }` | `200 { accessToken, refreshToken, userId }` (**refresh rotacionado**) | 401 `refresh-token-not-found\|revoked\|rotated\|expired` · 403 `user-disabled` · 400 `validation` |
| `POST /api/v2/auth/logout` | `{ refreshToken }` | `204` (sem corpo; idempotente) | 400 `validation` · 500 infra |
| `GET /api/v2/auth/me` | header `Authorization: Bearer <jwt>` | `200 { userId }` | 401 `unauthorized` |

- **Envelope de erro** (todos): `{ error: { code, message, requestId } }`; em falhas de domínio `message === code`
  (slug). **Discriminar por `code`**. (Já alinhado com `shared/http` da fundação.)
- `accessToken` = **JWT ES256** (claims `sub`=userId, `iss`='core-api', `iat`, `exp`); `refreshToken` = opaco
  (base64url 32B); **sem `expiresIn`/`tokenType`** na resposta.
- **Política:** access TTL **15 min**; refresh TTL **30 dias** (sliding — cada refresh emite novo +30d). Sem
  timeout de inatividade explícito (a expiração do refresh é o efeito prático).
- **Rotação obrigatória** + **reuse-detection**: reapresentar refresh já `rotated` → backend **revoga a cadeia
  inteira** e retorna `refresh-token-rotated`.
- **Logout** revoga **só** o refresh apresentado (não todos). `revokeAllSessions` existe mas **não tem rota**.
- **`/me` retorna SÓ `{ userId }`** — sem email/nome/roles.

## R1 — JWT: decode-only no BFF (não verificar assinatura)

**Decisão**: o BFF **decodifica** o access token (lê `exp`) para decidir o refresh; **não verifica** a
assinatura ES256. O core-api valida de verdade em cada chamada.

**Rationale**: o BFF recebeu o token do core-api por TLS (confiável); verificar exigiria distribuir a chave
pública (`AUTH_JWT_PUBLIC_KEY` SPKI) e, em dev, o core-api gera **par efêmero por boot** (a pública muda a cada
restart) — fricção alta para ganho marginal (defense-in-depth que o core-api já faz). Decode é suficiente para
o timing do refresh.

**Alternativas**: verificar assinatura no BFF — adiado (reavaliar em prod com chave pública estável,
possível ADR futuro). Não ler `exp` (refresh só on-401) — pior UX/latência; o on-401 fica como fallback.

## R2 — Single-flight no refresh (CRÍTICO)

**Decisão**: o BFF coordena **uma única** renovação por sessão (promessa/lock em voo); requests concorrentes
com access expirado **aguardam** a mesma renovação.

**Rationale**: o backend rotaciona o refresh a cada uso e tem reuse-detection — dois refreshes concorrentes com
o mesmo token fariam o segundo parecer "replay" → **revoga a cadeia toda** → sessão morta. Single-flight
elimina a corrida. Atende **FR-009**.

**Alternativas**: refresh ingênuo por request — rejeitado (quebraria sessões sob concorrência). Fila global —
desnecessário (basta single-flight por `sessionId`).

## R3 — `/me` mínimo: identidade = `userId`

**Decisão**: a UI conhece apenas `{ userId }` (estado autenticado + id). Email/nome/roles **não** existem no
contrato atual.

**Rationale**: `/me` do core-api retorna só `userId`; o JWT não traz email/roles. Identidade rica + RBAC
pertencem ao **módulo futuro "gerência de usuários"** (Zero Trust) — fora desta feature (Clarifications).

**Alternativas**: buscar perfil em outro endpoint — não existe hoje. Decodificar claims — só há `sub`. Documentar
a limitação e expor `userId` no `use-current-user.view-model`.

## R4 — Sessão & cookie

**Decisão**: cookie **`__Host-session`** com **sessionId opaco** (`HttpOnly; SameSite=Strict; Secure; Path=/`).
`SessionStore` server-side guarda `{ sessionId, userId, accessToken, refreshToken, refreshExpiresAt, persistent }`.
Default = **cookie de sessão** (sem Max-Age). "Lembrar este dispositivo" → `Max-Age = min(restante do refresh, 30d)`.
Logout: core-api `logout(refresh)` → apaga sessão → limpa cookie (limpa local mesmo se o remoto falhar — FR-011).

**Rationale**: alinha §I/ADR-0002 (token nunca no browser) + Clarifications (sessão default, persistência opt-in,
backend como autoridade). TTL do store = TTL do refresh (30d).

**Alternativas**: refresh no cookie — rejeitado (ADR-0002). Max-Age fixo independente do refresh — rejeitado
(não exceder o TTL absoluto).

## R5 — Dependências de sessão/cookie (constituição §VIII)

**Decisão (proposta — confirmar na implementação)**: usar **`jose`** para `decodeJwt` (ler `exp`, sem verificar)
e avaliar **`iron-session`** para selar o cookie. Preferir o mínimo: se o TanStack Start já oferece cookie
assinado/selado nativo suficiente + `crypto.randomUUID` para o sessionId, **evitar `iron-session`**.

**Rationale**: §VIII (minimal deps). `jose` é pequeno e evita reimplementar parsing de JWT. O selo do cookie
pode ser dispensável já que o cookie carrega só um **id opaco** (não dado sensível) — a segurança vem do store
server-side, não do conteúdo do cookie. → tendência: **sessionId via `crypto.randomUUID`, sem `iron-session`**;
`jose` só se o decode nativo não bastar.

**Alternativas**: `iron-session` (cookie selado) — útil se guardássemos dados no cookie; aqui é só id opaco, então
provável dispensar. Reimplementar decode de JWT no braço — rejeitado (risco). **Decisão final no início da impl.**

## R6 — Vitest + jsdom (testes de UI)

**Decisão**: introduzir **Vitest + jsdom + @testing-library/react** para testar `login.page` e os view-models
(DOM). `node:test` segue para o puro (`server/*`, `client/data|usecase`, guard, validações).

**Rationale**: a feature-modelo precisa exemplificar **teste de UI** (a fundação adiou isso). Render da page burra
+ asserts de estado da ViewModel exigem DOM.

**Alternativas**: só `node:test` — não cobre render. Playwright (e2e) — complementar/futuro, não substitui unit de UI.

## R7 — Event Bus & i18n (primeiros usos reais)

**Decisão**: criar `shared/bus` (Observer sobre `EventTarget`, eventos no passado) e `shared/i18n` (catálogo de
tags). Auth emite `UsuarioAutenticado`/`SessaoEncerrada`; o `use-current-user.view-model` assina para
invalidar/limpar a query `me`. Strings via tags (`auth.error.invalid-credentials`, etc.), default genérico.

**Rationale**: §XII (Event Bus) e §XI (strings = tags). Auth é o primeiro consumidor — vira a referência de uso.

**Alternativas**: invalidação manual sem bus — perde o padrão reativo cross-feature. Literais hardcoded —
proibido (§XI).

## R8 — Mapeamento de erro Auth → AppError/tags

**Decisão**: estender/usar `map-to-app-error` (por status) + um mapa de **slug → tag i18n** para as mensagens:
`invalid-credentials`→`auth:expired`? Não — login falho é `validation`/credenciais, não sessão. Mapear:
401 `invalid-credentials` → AppError `validation`(ou `unauthorized` específico) → tag `auth.error.invalid-credentials`;
403 `user-disabled` → tag `auth.error.user-disabled`; refresh-* (401) → `auth:expired` → signOut; `unauthorized`
(/me) → `auth:expired`. Default genérico anti-enumeração para credencial.

**Rationale**: a UI lê só `AppError` + tag (não slug nem status). Login tem erros próprios (não é "sessão
expirada"); refresh/me falho = sessão expirada → signOut.

**Alternativas**: expor slug do backend na UI — rejeitado (acopla + pode vazar). Mensagens literais — proibido.
