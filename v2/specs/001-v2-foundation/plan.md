# Implementation Plan: Fundação Técnica do Frontend v2

**Branch**: `feat/phase-12-backend-integration` (sem branch dedicada — decisão do time) | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-v2-foundation/spec.md`

## Summary

Materializar, em código, a fundação técnica que todo módulo do v2 vai consumir, seguindo a
constituição v1.1.0 (arquitetura vertical-modular espelhando o core-api). Entrega três blocos:
**(A)** bootstrap do TanStack Start rodável (`router`, `__root`, rota `index`/health) em `:3000`;
**(B)** `src/shared/` puro (primitives `Result`/`Brand`/imutabilidade; cadeia de erro
`HttpError`/`AppError`/`QueryError` + `map-to-app-error`); **(C)** `src/external/` (cliente HTTP
`Result`-based com timeout/abort; `map-to-server-response` preservando status; `env.config` Zod
fail-fast). Inclui também o **QueryClient** (TanStack Query) com `queryCache.onError`
(401/auth:expired → signOut+clear) e `mutationCache.onSuccess` (invalidação). A abordagem técnica
adapta os snippets do `handbook/arquiteture.md` aos nomes de pasta `shared/external` e alinha o
mapeamento de erro ao **envelope real do core-api** (`{ error: { code, message, requestId } }`).

## Technical Context

**Language/Version**: TypeScript 6.0 (estrito máximo; roadmap TS 7 — `erasableSyntaxOnly` + `verbatimModuleSyntax`)

**Primary Dependencies**: `@tanstack/react-start` ^1.168, `@tanstack/react-router` ^1.170, React 19, Zod 4, **`@tanstack/react-query` (a instalar)**; Vite 8

**Storage**: N/A nesta feature (sem persistência local; sessão real é da feature Auth). `SessionStore` aparece só como **port** (type) em `shared/ports`, sem adapter real ainda.

**Testing**: runner híbrido — `node:test` para puro (`shared/`, `external/`), Vitest para DOM (rotas/UI futura). Nesta fundação: testes de `node:test` para primitives, map-to-app-error, result-fetch (com fetch stubado) e map-to-server-response. **(G1)** Como os testes são `.ts`, definir script `"test": "node --experimental-strip-types --test"` no `package.json` (Node 22+); imports nos testes são **relativos** (alias `~`/`@` resolve só no bundler).

**Target Platform**: Node 20+ (runtime Nitro do TanStack Start); browser moderno (React 19 SSR). Dev em `http://localhost:3000`.

**Project Type**: Web app full-stack (front + BFF unificado).

**Performance Goals**: N/A específico — `pnpm dev` sobe < 1 min (SC-001); `result-fetch` com timeout default 10s.

**Constraints**: invariantes da constituição v1.1.0 (sem `any`/`class` exceto `QueryError`/`throw` fora da borda; imutabilidade; `import type`; boundaries `modules/shared/external` + MVVM). Browser nunca vê token/segredo/URL do backend (FR-015, SC-005). **(S1)** `env.config` é **server-only**: `CORE_API_URL` NÃO usa prefixo `VITE_` e nunca é importado por código de client/UI — só por `external/` (server-side) e server functions; verificável inspecionando o bundle do browser.

**Scale/Scope**: fundação — ~15-20 arquivos pequenos em `shared/`+`external/`+composition root. Sem módulo de negócio ainda (um módulo de exemplo pode ser esboçado p/ validar boundaries — SC-006, opcional).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Avaliação contra os 11 princípios da constituição v1.1.0:

| Princípio | Aplicação nesta feature | Status |
|-----------|--------------------------|--------|
| I. BFF-Orchestrated | Cliente HTTP e env só em `external/` (server-side); browser não vê segredos | ✅ por design |
| II. Errors Are Values | `Result<T,E>` nos primitives; `result-fetch` nunca lança; `QueryError` única subclasse | ✅ |
| III. Vertical-Modular Boundaries | `shared/` puro + `external/` (I/O); composition root em `routes/`+`router` (ignored) | ✅ |
| IV. Illegal States Unrepresentable | `Brand`+smart constructor; unions discriminadas (`HttpError`/`AppError`) + switch `never` | ✅ |
| V. Server-State ≠ UI-State | QueryClient configurado; cadeia de erro completa; sem UI-state aqui | ✅ |
| VI. Validation at Boundary | `env.config` com Zod; schemas de response virão por módulo (não nesta base) | ✅ |
| VII. Strict TS / 6→7 | sem enum/namespace/param-props; `import type`; sem `any` | ✅ enforce por lint |
| VIII. Minimal Dependencies | só `@tanstack/react-query` adicionada (server-state oficial); resto nativo (fetch, AbortController, crypto) | ✅ justificada |
| IX. pnpm Only | instalação via `pnpm add` | ✅ |
| X. Spec-Driven | esta é a spec 001; fluxo seguido | ✅ |
| XI. MVVM Dumb Views | rotas desta base são triviais (health/index); enforcement de lint já ativo | ✅ |

**Resultado do GATE: PASS.** Nenhuma violação. Sem entradas em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-v2-foundation/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões resolvidas
├── data-model.md        # Phase 1 — tipos-entidade (Result, HttpError, AppError, ...)
├── quickstart.md        # Phase 1 — como subir e validar
├── contracts/           # Phase 1 — contratos (health, envelope de erro, mapa de status)
│   ├── health.md
│   └── error-envelope.md
└── checklists/
    └── requirements.md  # criado no /speckit-specify
```

### Source Code (repository root)

```text
src/
├── router.tsx                         # createRouter + QueryClient (composition root)
├── routes/
│   ├── __root.tsx                     # shell SSR (html/head/body, providers)
│   ├── index.tsx                      # rota inicial (smoke) + link health
│   └── health.tsx                     # rota /health do FRONT (FR-002): retorna/exibe { status: 'ok' }
├── shared/                            # cross-cutting PURO (sem framework/I/O)
│   ├── primitives/                    # VENDORIZADO do core-api (cópia fiel — R8)
│   │   ├── result.ts                  # Result<T,E> (.ok) + ok/err/isOk/isErr/mapErr/combine
│   │   ├── brand.ts                   # Brand<T,K> via unique symbol + BrandOf
│   │   └── immutable.ts               # immutable / deepImmutable
│   ├── http/
│   │   ├── http-error.types.ts        # HttpError (transporte)
│   │   ├── app-error.types.ts         # AppError (semântico p/ UI)
│   │   ├── map-to-app-error.ts        # HttpError → AppError (switch exaustivo)
│   │   ├── error-envelope.ts          # parse do envelope real do core-api { error: {code,message,requestId} }
│   │   └── query-error.ts             # QueryError (única subclasse de Error)
│   ├── ports/
│   │   └── session-store.port.ts      # (C1) ESBOÇO OPCIONAL — contrato (type) p/ terreno da feature Auth; sem FR nesta base. Pode nascer só na spec de Auth.
│   ├── utils/
│   │   └── id.ts                      # crypto.randomUUID wrapper (correlation id)
│   └── ui/                            # design system — placeholder (vazio/README) nesta base
├── external/                          # EXTERNAL ADAPTERS (I/O real + segredos)
│   ├── config/
│   │   └── env.config.ts              # Zod fail-fast; expõe CORE_API_URL
│   └── core-api/
│       ├── result-fetch.ts            # fetch → Result<T,HttpError> (timeout/abort), token opcional
│       └── map-to-server-response.ts  # HttpError → Response (preserva status upstream)
└── styles/ (se necessário)

tests/                                 # espelha src/ (node:test p/ puro)
├── shared/primitives/result.test.ts
├── shared/http/map-to-app-error.test.ts
└── external/core-api/result-fetch.test.ts
```

> `routes/`, `router*`, `client*`, `ssr*`, `start*` estão no `boundaries/ignore` (composition root / framework glue) — fora da matriz de camadas.

**Structure Decision**: estrutura vertical-modular da constituição v1.1.0. Esta fundação só preenche
`shared/` + `external/` + composition root (`router`/`routes`). `src/modules/` nasce vazio (primeiro
módulo virá na próxima spec — Auth). `shared/ui` e `shared/ports` entram como esqueleto mínimo.

## Decisões-chave (resumo; detalhe em research.md)

1. **Envelope de erro real do core-api** é `{ error: { code, message, requestId } }` — **sem** `issues[]`.
   `map-to-app-error` mapeia por **status HTTP** (401→auth:expired, 403→auth:forbidden, 404→not-found,
   409→conflict, 400→validation, ≥500→server) e extrai `code`/`message`/`requestId` do envelope para
   contexto/observabilidade. Validação por campo é feita no BFF com Zod (backend não vaza issues).
2. **Health**: `GET /health` do core-api retorna `{ status: 'ok' }` (sem prefixo). A rota de health do
   **front** é própria (SSR/index) — não proxia o backend nesta base.
3. **TanStack Query incluso** (cobre **FR-019** — fecha a cadeia de erro): `pnpm add @tanstack/react-query`;
   QueryClient no `router.tsx` com `queryCache.onError` (auth:expired → clear + navigate login) e
   `mutationCache.onSuccess` (invalidate).
4. **Portas de dev (anti-conflito)**: host `:3000`/`:3001` livres; vite fica em `:3000`. O core-api do
   Docker **não** é exposto ao host. Plano oferece **expor core-api** (`ports: ['3001:3000']`) +
   `CORE_API_URL=http://localhost:3001/api/v2` para dev local; **ou** dev dockerizado via Caddy
   (`app.localhost`, `CORE_API_URL=http://core-api:3000/api/v2`). Decisão final em research.md.
5. **`result-fetch`**: base `globalThis.fetch` (nativo, Princípio VIII) com `AbortController`+timeout;
   token opcional por argumento (sessão real é da feature Auth).

## Complexity Tracking

> Nenhuma violação da constituição. Tabela vazia.
