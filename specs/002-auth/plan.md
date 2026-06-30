# Implementation Plan: Autenticação (Auth) — Feature-Modelo

**Branch**: `feat/v2-auth` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/002-auth/spec.md` (+ Clarifications) · Constituição **v1.2.0** · ADRs 0001-0004

## Summary

Implementar a Auth como **feature-modelo**: módulo `src/modules/auth/` com **separação client × server**
(ADR-0004). O **`server/` (BFF/DDD)** orquestra o core-api (login/logout/me/refresh), guarda os tokens no
**SessionStore server-side** (`external/session`) e expõe **server functions** (a fronteira RPC). O
**`client/` (FRONT/MVVM)** consome essas server functions via **Repository (porta)**, padroniza em **Model**
(Zod), e a tela `/login` é a **vitrine do MVVM** (ViewModel + Controller + page burra). Tudo com **TDD**
(testes antes da impl) e **documentação do porquê** (README "anatomia" + inline + ADRs).

Contrato do backend **confirmado** com `core-api-consultant` (ver research.md): paths `/api/v2/auth/*`,
shapes exatos, rotação obrigatória do refresh + reuse-detection, access 15 min / refresh 30 dias.

## Technical Context

**Language/Version**: TypeScript 6 estrito (constituição v1.2.0).

**Primary Dependencies**: `@tanstack/react-start`/`react-router`/`react-query` (fundação), Zod 4. **A avaliar**
no research: lib de sessão/cookie selado (ex.: `iron-session`/`jose`) vs. cookie próprio + store.

**Storage**: `SessionStore` server-side (`external/session`) — in-memory em dev; **compartilhável** (Redis-like)
em prod p/ escala horizontal. Cookie `__Host-session`/sessionId opaco.

**Testing**: TDD. `node:test` p/ puro (`server/domain|application`, `client/data|usecase`, mappers, validações
de cookie/redirect); Vitest p/ DOM (`client/ui`, `view-model`) — **a feature-modelo introduz o setup Vitest+jsdom**
(decisão adiada na fundação, agora necessária p/ a tela `/login`).

**Target Platform**: BFF Node (server functions) + browser React 19 SSR.

**Performance Goals**: login em poucos segundos (SC-001); refresh silencioso imperceptível (SC-003).

**Constraints**: token nunca no browser (§I/ADR-0002); `Result`/cadeia de erro; MVVM (§XI); boundaries
(§III/ADR-0004); strings = tags i18n (`shared/i18n`); **single-flight no refresh** (reuse-detection do backend).

**Scale/Scope**: módulo-modelo; login/logout/me/refresh/guard. SessionStore com TTL = refresh (30d).

## Constitution Check (v1.2.0)

*GATE: passar antes do Phase 0; reavaliar após Phase 1.*

| Princípio | Aplicação na Auth | Status |
|-----------|-------------------|--------|
| I. BFF-Orchestrated | tokens só no `server/` + `external/session`; client chama server functions | ✅ |
| II. Errors Are Values | `Result` no server; Repository client → `QueryError(AppError)`; cadeia completa | ✅ |
| III. Client × Server | `auth/server/{domain,application,adapters}` + `auth/client/{data,usecase,view-model,ui}` + public-api | ✅ |
| IV. Illegal States | branded (`Email`, `SessionId`), unions de erro, switch `never` | ✅ |
| V. Server≠UI state | ViewModel liga Query (me) + store (form via Controller) | ✅ |
| VI. Validation boundary | Zod no input da server fn E no response do core-api E no Repository client | ✅ |
| VII. Strict TS | sem any/enum/namespace; `import type` | ✅ |
| VIII. Minimal deps | avaliar `iron-session`/`jose` (justificado em research) vs nativo | ⚠ research |
| IX. pnpm | `pnpm add` se preciso (supply-chain aplica) | ✅ |
| X. Spec-Driven | esta spec 002; TDD | ✅ |
| XI. MVVM | `/login`: page burra + `*.view-model.ts` + `*.controller.ts` | ✅ |
| XII. Event Bus | `UsuarioAutenticado`/`SessaoEncerrada` emitidos no `client/usecase`, assinados p/ invalidar `me` | ✅ |

**GATE: PASS** (1 item a resolver no research: dependência de sessão/cookie).

## Project Structure (módulo Auth)

```
src/modules/auth/
├── server/                                  # BFF / DDD (server-side; tokens aqui)
│   ├── domain/
│   │   ├── email.value-object.ts            # Email branded (smart constructor)
│   │   ├── session.types.ts                 # Session { sessionId, userId, access, refresh, expiresAt, persistent }
│   │   ├── auth.errors.ts                    # union: invalid-credentials | user-disabled | refresh-* | ...
│   │   ├── session-store.port.ts             # port (type) do SessionStore
│   │   └── auth.events.ts                    # (server) eventos de domínio, se houver
│   ├── application/
│   │   ├── login.use-case.ts                 # valida → core-api login → cria sessão → Result
│   │   ├── logout.use-case.ts                # core-api logout(refresh) → apaga sessão
│   │   ├── refresh-session.use-case.ts       # SINGLE-FLIGHT: core-api refresh → rotaciona → atualiza store
│   │   └── get-me.use-case.ts                # Bearer → core-api /me → { userId }
│   └── adapters/
│       ├── login.server-fn.ts                # createServerFn (RPC) — seta cookie sessionId
│       ├── logout.server-fn.ts               # createServerFn — limpa cookie + revoga
│       ├── me.server-fn.ts                    # createServerFn — resolve sessão → { userId }
│       ├── session.guard.ts                  # resolve cookie→sessão→token (+ refresh silencioso single-flight)
│       ├── core-api-auth.client.ts           # chama /api/v2/auth/* via external/core-api (result-fetch)
│       └── auth.schema.ts                     # Zod dos responses do core-api (login/refresh/me)
├── client/                                   # FRONT / MVVM (browser; só sessionId no cookie)
│   ├── data/
│   │   ├── auth.model.ts                      # Zod do que o BFF devolve à UI (CurrentUser { userId }, LoginResult)
│   │   └── auth.repository.ts                 # PORTA → chama login/logout/me server functions
│   ├── usecase/
│   │   ├── login.use-case.ts                  # orquestra repository + emite UsuarioAutenticado no bus
│   │   └── logout.use-case.ts                 # repository.logout + emite SessaoEncerrada
│   ├── view-model/
│   │   ├── use-login.view-model.ts            # TanStack mutation; estados idle/submitting/error; redirect
│   │   └── use-current-user.view-model.ts     # TanStack query (me); assina bus p/ invalidar
│   └── ui/
│       ├── login.page.tsx                     # template BURRO (compõe view-model + controller + components)
│       ├── login-form.controller.ts           # estado transiente do form (email/senha/lembrar) + Zod local
│       └── (components reusam shared/ui)
├── public-api/
│   └── index.ts                               # expõe: guard/route helpers, use-current-user, tipos públicos
└── README.md                                  # "anatomia da feature" (vitrine p/ devs/agentes)

src/external/session/                          # SessionStore impl (in-memory dev) + cookie selado
src/shared/bus/                                # Event Bus (Observer) — criar nesta feature
src/shared/i18n/                               # catálogo de tags de mensagem (auth.*)
src/routes/login.tsx                           # rota /login (beforeLoad: logado→/) → renderiza login.page
src/routes/_authenticated/                      # layout/guard de rotas protegidas (usa public-api da auth)
```

> Fronteira client↔server = as **server functions** em `server/adapters`. O `client/data/repository` é o
> único client que as chama. Views burras não importam nada disso (lint §XI).

**Structure Decision**: ADR-0004 (client/server split). Auth materializa o padrão completo — é a referência.

## Decisões-chave (detalhe em research.md)

1. **JWT: decode-only no BFF.** O BFF lê o `exp` do access token (decode, **sem** verificar assinatura — já
   veio do core-api por TLS) p/ decidir o refresh. Evita distribuir a chave pública e a dor de chaves
   efêmeras em dev. O core-api valida a assinatura de verdade. (Reavaliar verificação real em prod.)
2. **Single-flight no refresh** (CRÍTICO): o backend rotaciona o refresh a cada uso e tem **reuse-detection**
   (reapresentar token rotacionado → revoga a cadeia toda). Logo o BFF coordena **uma** renovação por sessão
   (lock/promessa em voo) — 2 requests simultâneos com access expirado NÃO podem disparar 2 refreshes.
3. **`/me` só tem `{userId}`** — a UI conhece só o userId. Identidade rica (email/nome/roles) é **futura**
   (módulo "gerência de usuários"). US5 mostra estado autenticado + userId; documentar a limitação.
4. **Sessão**: cookie `__Host-session` opaco; SessionStore guarda `{access, refresh, userId, expiresAt,
   persistent}`. Default cookie de sessão; "lembrar" → Max-Age ≤ 30d. Logout revoga só aquele refresh.
5. **Dependência de sessão/cookie**: avaliar `iron-session` (cookie selado) + `jose` (decode JWT) vs nativo —
   decisão em research (constituição §VIII exige justificativa).
6. **Vitest + jsdom**: introduzir agora p/ testar `login.page`/view-model (DOM). `node:test` segue p/ o puro.
7. **i18n**: `shared/i18n` com tags `auth.error.invalid-credentials`, etc. (textos default genéricos; P.O. refina).

## Complexity Tracking

| Item | Por que necessário | Alternativa rejeitada |
|------|--------------------|-----------------------|
| `iron-session`/`jose` (a confirmar) | cookie selado seguro + decode JWT sem reimplementar cripto | nativo `crypto` — mais código/risco; decidir em research |
| Vitest + jsdom | testar a tela `/login` (DOM) — feature-modelo precisa do exemplo de teste de UI | só `node:test` — não testa render |
| Single-flight refresh | reuse-detection do backend revoga a sessão se houver refresh concorrente | refresh ingênuo — quebraria sessões em corrida |
