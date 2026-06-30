---
description: "Task list — Autenticação (Auth), feature-modelo (TDD)"
---

# Tasks: Autenticação (Auth)

**Input**: `specs/002-auth/` (spec ✅, plan ✅, research ✅, data-model ✅, contracts ✅, quickstart ✅)

**Tests**: **TDD OBRIGATÓRIO** — teste ANTES da impl em cada unidade (red→green). Runner: `node:test` (puro)
+ **Vitest/jsdom** (DOM da `/login`). Nos pontos de UI, **perguntar ao usuário o tipo de teste** (unit/BDD).

**Branch**: `feat/v2-auth`. **Arquitetura**: v1.2.0 / ADR-0004 (`server/` DDD + `client/` MVVM; fronteira = server fn).

## Format: `[ID] [P?] [Story] Description`

> Boundaries (lint): `client/*` nunca importa `server/domain|application` (só chama server fn via
> `client/data/repository`); views burras (`*.page.tsx`/`*.component.tsx`) não importam server/data/usecase/repository.

---

## Phase 1: Setup

- [x] T001 [P] Avaliar/instalar deps do research (R5/R6): `pnpm add jose` (decode JWT) **se** o decode nativo não bastar; `pnpm add -D vitest jsdom @testing-library/react @testing-library/dom`. **Não** instalar `iron-session` (sessionId via `crypto.randomUUID`, cookie carrega só id opaco — R5). Supply-chain aplica (exclude por versão se quarentena pegar).
- [x] T002 [P] Configurar Vitest (`vitest.config.ts`, ambiente jsdom só p/ `*.dom.test.ts(x)`) + script `test:dom` no `package.json`; manter `node:test` p/ o puro.
- [x] T003 Criar esqueleto de pastas: `src/modules/auth/{server/{domain,application,adapters},client/{data,usecase,view-model,ui},public-api}`, `src/external/session/`, `src/shared/bus/`, `src/shared/i18n/`, e `tests/` espelhando.

---

## Phase 2: Foundational (bloqueia todas as stories)

**⚠️ CRITICAL**: machinery de sessão + cross-cutting; nenhuma story avança sem isto.

### shared/bus (Event Bus — §XII) — TDD
- [x] T004 [P] Teste `node:test` do Event Bus → `tests/shared/bus/bus.test.ts` (emit/subscribe; evento no passado; unsubscribe; sem loop)
- [x] T005 [P] Impl `src/shared/bus/bus.ts` — Observer sobre `EventTarget` nativo (green p/ T004)

### shared/i18n (catálogo de tags) — TDD
- [x] T006 [P] Teste `node:test` do resolver de tags → `tests/shared/i18n/i18n.test.ts` (chave→string; fallback; chave ausente)
- [x] T007 [P] Impl `src/shared/i18n/{index.ts,catalog.pt-BR.ts}` — tags `auth.*` (textos default genéricos; P.O. refina) (green p/ T006)

### external/session (SessionStore) — TDD
- [x] T008 [P] Teste `node:test` do SessionStore in-memory → `tests/external/session/session-store.test.ts` (create/get/update/delete; expiração por TTL)
- [x] T009 Impl `src/external/session/session-store.memory.ts` (implementa a port; TTL=refresh; **interface compartilhável** p/ trocar por Redis-like) (green p/ T008)
- [x] T010 [P] Teste `node:test` do cookie helper → `tests/external/session/cookie.test.ts` (`__Host-session`; HttpOnly/SameSite=Strict/Secure; Max-Age só se persistent)
- [x] T011 Impl `src/external/session/cookie.ts` — set/read/clear do cookie sessionId opaco (green p/ T010)

### server/domain (puro) — TDD
- [x] T012 [P] Teste `node:test` do `Email` VO → `tests/modules/auth/server/domain/email.test.ts` (smart constructor: empty/invalid/ok)
- [x] T013 [P] Impl `src/modules/auth/server/domain/email.value-object.ts` (Brand + smart constructor) (green)
- [x] T014 [P] `src/modules/auth/server/domain/session.types.ts` (Session, SessionId branded) — tipos puros
- [x] T015 [P] `src/modules/auth/server/domain/auth.errors.ts` (união de erros + slugs do core-api)
- [x] T016 [P] `src/modules/auth/server/domain/session-store.port.ts` (port type) + `auth.events.ts` (se houver evento server)

### server/adapters — core-api client + Zod — TDD
- [x] T017 [P] Teste `node:test` do `auth.schema` (Zod) → `tests/modules/auth/server/adapters/auth-schema.test.ts` (AuthTokens, Me; rejeita shape errado)
- [x] T018 [P] Impl `src/modules/auth/server/adapters/auth.schema.ts` (Zod dos responses do core-api) (green)
- [x] T019 Teste `node:test` do `core-api-auth.client` → `tests/modules/auth/server/adapters/core-api-auth-client.test.ts` (fetch stubado: login/refresh/logout/me; mapeia envelope→AuthError por `code`; nunca lança)
- [x] T020 Impl `src/modules/auth/server/adapters/core-api-auth.client.ts` (usa `external/core-api` result-fetch; `/api/v2/auth/*`) (green p/ T019)

### server/application — refresh single-flight + me (foundational; guard depende) — TDD
- [x] T021 Teste `node:test` `refresh-session.use-case` → `tests/.../application/refresh-session.test.ts` — **inclui single-flight** (2 chamadas concorrentes → 1 refresh; atualiza store com refresh novo) e **reuse-detection** (`refresh-token-rotated` → sessão morta/signOut)
- [x] T022 Impl `src/modules/auth/server/application/refresh-session.use-case.ts` (single-flight por sessionId; rotaciona; atualiza store) (green p/ T021)
- [x] T023 [P] Teste `node:test` `get-me.use-case` → `tests/.../application/get-me.test.ts` (Bearer→/me→{userId}; 401→auth:expired)
- [x] T024 [P] Impl `src/modules/auth/server/application/get-me.use-case.ts` (green)

### server/adapters — decode-exp util (D1; usado pelo guard) — TDD
- [x] T024a [P] Teste `node:test` `decode-access-exp` → `tests/.../adapters/decode-access-exp.test.ts` (decode-only do `exp` do JWT; token malformado → null; **não** verifica assinatura — R1)
- [x] T024b [P] Impl `src/modules/auth/server/adapters/decode-access-exp.ts` (decode base64url do payload, lê `exp`; `jose.decodeJwt` se instalado) (green p/ T024a)

### server/adapters — session.guard (cookie→sessão→token + refresh silencioso) — TDD
- [x] T025 Teste `node:test` `session.guard` → `tests/.../adapters/session-guard.test.ts` (sem cookie→null; access válido→token; access expirado+refresh ok→refresh single-flight; refresh inválido→limpa sessão+cookie→auth:expired)
- [x] T026 Impl `src/modules/auth/server/adapters/session.guard.ts` (usa `decode-access-exp` p/ o `exp`; usa refresh-session.use-case) (green p/ T025)

### shared — CSRF de origem nas mutações (C1; FR-014) — TDD
- [x] T026a [P] Teste `node:test` da validação de origem → `tests/shared/http/csrf-origin.test.ts` (aceita same-origin; rejeita `Origin`/`Sec-Fetch-Site` cross-site em mutações POST)
- [x] T026b Impl `src/shared/http/csrf-origin.ts` (helper/middleware p/ server functions de mutação: valida `Origin`/`Sec-Fetch-Site`; complementa o `SameSite=Strict` do cookie) (green p/ T026a). Aplicado em login/logout server-fns.

**Checkpoint**: machinery de sessão verde — stories podem começar.

---

## Phase 3: User Story 1 - Login (Priority: P1) 🎯 MVP

**Goal**: login end-to-end (email/senha → sessão + cookie; tela `/login`). **Independent Test**: login com
`admin@bemcomum.dev`/`DevPassw0rd!2024` cria sessão+cookie e redireciona; credencial inválida → tag genérica.

### server (DDD)
- [x] T027 [US1] Teste `node:test` `login.use-case` → `tests/.../application/login.test.ts` (valida→core-api login→cria sessão→Result; invalid-credentials; user-disabled)
- [x] T028 [US1] Impl `src/modules/auth/server/application/login.use-case.ts` (green)
- [x] T029 [US1] Teste `node:test` `login.server-fn` → `tests/.../adapters/login-server-fn.test.ts` (input Zod; seta cookie; rememberDevice→Max-Age; retorna {userId}; nunca vaza token)
- [x] T030 [US1] Impl `src/modules/auth/server/adapters/login.server-fn.ts` (createServerFn) (green)

### client (MVVM)
- [x] T031 [US1] Teste `node:test` `auth.model` (Zod) → `tests/.../client/data/auth-model.test.ts` (LoginInput; CurrentUser)
- [x] T032 [US1] Impl `src/modules/auth/client/data/auth.model.ts` (green)
- [x] T033 [US1] Teste `node:test` `auth.repository` → `tests/.../client/data/auth-repository.test.ts` (porta chama login server-fn stubada; valida Zod; erro→QueryError(AppError))
- [x] T034 [US1] Impl `src/modules/auth/client/data/auth.repository.ts` (green)
- [x] T035 [US1] Teste `node:test` `client/usecase/login` → `tests/.../client/usecase/login.test.ts` (orquestra repository; emite `UsuarioAutenticado` no bus)
- [x] T036 [US1] Impl `src/modules/auth/client/usecase/login.use-case.ts` (green)
- [x] T037 [US1] Teste `client/view-model/use-login` (Vitest/jsdom — **perguntar tipo de teste**) → `tests/.../view-model/use-login.dom.test.ts` (idle→submitting→error; sucesso→redirect interno-validado; erro→tag)
- [x] T038 [US1] Impl `src/modules/auth/client/view-model/use-login.view-model.ts` (TanStack mutation) (green)
- [x] T039 [US1] Teste `node:test` `login-form.controller` → `tests/.../ui/login-form-controller.test.ts` (estado transiente; Zod local antes do submit)
- [x] T040 [US1] Impl `src/modules/auth/client/ui/login-form.controller.ts` (green)
- [x] T041 [US1] Teste `login.page` (Vitest/jsdom — **perguntar tipo**) → `tests/.../ui/login-page.dom.test.tsx` (render; campos; estados via view-model; view BURRA — sem fetch)
- [x] T042 [US1] Impl `src/modules/auth/client/ui/login.page.tsx` (template burro) (green)
- [x] T043 [US1] Rota `src/routes/login.tsx` (`/login`; `beforeLoad`: logado→`/`) renderiza `login.page`

**Checkpoint**: login funcional ponta-a-ponta (MVP demonstrável).

---

## Phase 4: User Story 2 - Guard de rota (Priority: P1)

**Goal**: rotas protegidas exigem sessão; sem sessão→`/login?redirect=`; pós-login volta. **Independent Test**:
acessar rota protegida sem sessão redireciona preservando destino; com sessão acessa.

- [x] T044 [US2] Teste `node:test` do validador de redirect → `tests/.../client/redirect.test.ts` (aceita `/x`; rejeita `//x`, `http://...`, externo → cai em `/`) — **anti open-redirect**
- [x] T045 [US2] Impl helper `src/modules/auth/client/data/safe-redirect.ts` (green)
- [x] T046 [US2] Teste `node:test` do guard de rota → `tests/.../guard.test.ts` (sem sessão→redirect login c/ destino; com sessão→ok; auth:expired→login)
- [x] T046a [US2] Criar `src/modules/auth/public-api/index.ts` com o **mínimo p/ o guard** (helper de guard/sessão + `use-current-user`) — **antes** do T047 consumir (O1). Finalizado/expandido em T059.
- [x] T047 [US2] Impl guard `src/routes/_authenticated/route.tsx` (`beforeLoad` usa o `public-api` da auth — T046a) (green)
- [x] T047a [US2] (C2 / FR-006) Atualizar `onAuthExpired` no `src/router.tsx` (fundação) → `navigate('/login', { search: { redirect } })` em vez de `'/'`; teste `node:test` em `tests/router/query-client.test.ts` ajustado (auth:expired → /login)

**Checkpoint**: conteúdo protegido de fato; 401 leva ao login.

---

## Phase 5: User Story 3 - Renovação silenciosa (Priority: P2)

**Goal**: access expira → refresh transparente; falha→login. (Impl em Foundational T022/T026; aqui valida UX+borda.)

- [x] T048 [US3] Teste de integração `node:test` → `tests/.../refresh-flow.test.ts` (access expirado + ação autenticada → refresh single-flight → ação conclui SEM novo login; refresh inválido → auth:expired→signOut)
- [x] T049 [US3] Garantir wiring: `me.server-fn`/guard chamam `session.guard` (refresh silencioso) — ajustar se T048 revelar gap

**Checkpoint**: sessão "não cai" durante o trabalho; corrida não mata a sessão.

---

## Phase 6: User Story 4 - Logout (Priority: P2)

**Goal**: logout revoga refresh no backend + apaga sessão + limpa cookie; limpa local mesmo se remoto falhar.

- [x] T050 [US4] Teste `node:test` `logout.use-case` → `tests/.../application/logout.test.ts` (core-api logout(refresh)→apaga sessão; falha remota→ainda limpa local)
- [x] T051 [US4] Impl `src/modules/auth/server/application/logout.use-case.ts` (green)
- [x] T052 [US4] Teste `node:test` `logout.server-fn` → `tests/.../adapters/logout-server-fn.test.ts` (limpa cookie; idempotente)
- [x] T053 [US4] Impl `src/modules/auth/server/adapters/logout.server-fn.ts` (green)
- [x] T054 [US4] Teste `node:test` `client/usecase/logout` → `tests/.../client/usecase/logout.test.ts` (orquestra repository.logout; emite `SessaoEncerrada` no bus)
- [x] T054a [US4] Impl `src/modules/auth/client/usecase/logout.use-case.ts` (green p/ T054)

**Checkpoint**: sair encerra a sessão de verdade.

---

## Phase 7: User Story 5 - Usuário atual (Priority: P2)

**Goal**: UI reflete autenticado + `userId` (limitação R3: /me só tem userId).

- [x] T055 [US5] Teste `node:test` `me.server-fn` → `tests/.../adapters/me-server-fn.test.ts` (sessão→{userId}; sem sessão→auth:expired)
- [x] T056 [US5] Impl `src/modules/auth/server/adapters/me.server-fn.ts` (green)
- [x] T057 [US5] Teste `use-current-user.view-model` (Vitest/jsdom — **perguntar tipo**) → query `me`; assina bus (`UsuarioAutenticado`/`SessaoEncerrada` invalida); `{ user?, isAuthenticated }`
- [x] T058 [US5] Impl `src/modules/auth/client/view-model/use-current-user.view-model.ts` (green)

**Checkpoint**: estado autenticado visível na UI.

---

## Phase 8: Polish & Cross-Cutting (feature-modelo)

- [x] T059 **Finalizar/expandir** `src/modules/auth/public-api/index.ts` (criado no T046a) — expõe guard/route helpers, `use-current-user`, tipos públicos (nada de server/domain)
- [x] T060 [P] **`src/modules/auth/README.md`** — "anatomia da feature": papel de cada camada, fluxo de login ponta-a-ponta, server×client, como replicar (FR-016; SC-008). Didático.
- [x] T061 [P] Comentários inline didáticos (o *porquê*) nos arquivos-chave (server-fn, session.guard, view-model, controller)
- [x] T062 [P] ADRs novos das decisões da Auth → `handbook/adr/0005-*` (sessão/cookie + single-flight refresh + JWT decode-only) e atualizar índice
- [x] T063 Verificar **nenhum token vaza no browser** (SC-002): `pnpm build` + grep no bundle client por token/refresh/CORE_API_URL; inspeção DevTools no quickstart
- [x] T064 Quality gate: `pnpm lint` (boundaries server/client + MVVM) · `pnpm typecheck` · `pnpm test` (node:test) · `pnpm test:dom` (Vitest) · `pnpm build` — tudo verde
- [x] T065 Validar `quickstart.md` ponta-a-ponta com credenciais reais (login/refresh/logout/guard)

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2)** bloqueia tudo (sessão/bus/i18n/guard/refresh).
- **US1 Login** depende de Foundational. **US2 Guard** depende de US1 (precisa de sessão) + guard/me.
- **US3 Refresh** valida machinery do Foundational (T022/T026). **US4 Logout** e **US5 Me** dependem de Foundational + login.
- **Polish** por último.

### Regra TDD (cada unidade)
1. (UI) **perguntar tipo de teste** (unit/BDD). 2. Escrever teste → **ver falhar (red)**. 3. Implementar → **green**. 4. Refatorar.

### Parallel Opportunities
- Setup T001/T002 [P]. Foundational: bus/i18n/session/domain em paralelo ([P] nos testes + impls de arquivos distintos). US1: model/repository/controller testes [P].

---

## Implementation Strategy
- **MVP**: Setup → Foundational → **US1 Login** (tela funcional) → validar. Depois US2 (guard), US3 (refresh), US4 (logout), US5 (me). Polish (README/ADRs/gate) fecha.
- Cada story testada e verde antes da próxima; commit por par teste→impl.

## Notes
- `/me` só devolve `{userId}` (R3) — não inventar email/roles. Single-flight no refresh é **obrigatório** (reuse-detection do backend). Strings = tags i18n (sem literais). Boundaries enforçados por lint.
