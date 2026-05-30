---
description: "Task list — Fundação Técnica do Frontend v2 (TDD)"
---

# Tasks: Fundação Técnica do Frontend v2

**Input**: Design documents from `specs/001-v2-foundation/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: **TDD OBRIGATÓRIO** — em cada unidade o(s) teste(s) vêm **ANTES** da implementação
(red → green → refactor). Antes de escrever, **perguntar ao usuário o tipo de teste** (unitário vs BDD).
Runner: `node --test` (puro `shared/`/`external/`), Vitest (DOM/rotas). Testes dos primitivos são
**vendorizados** de `core-api/tests/shared/{result,brand,immutable}.test.ts`.

**Branch**: permanecer em `feat/phase-12-backend-integration`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizável (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 (app rodável) · US2 (shared/) · US3 (external/) — Setup/Foundational/Polish sem label
- Dentro de cada fase: **### Tests (TDD — escrever/ver falhar primeiro)** → **### Implementation (green)**

> **Dependência entre stories (fundação é layered):** `Result` (Foundational) bloqueia tudo; US3 usa
> `HttpError` de US2; o wiring do QueryClient (US1) usa `QueryError`/`AppError` de US2. Ordem:
> Foundational → US2 → US3 → US1. App mínimo rodável já no Setup (T004).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependências, scripts e esqueleto de pastas; app mínimo rodável. (Sem lógica testável → sem TDD; T004 é validado por smoke manual.)

- [x] T001 [P] Instalar TanStack Query: `pnpm add @tanstack/react-query` (atualiza `package.json` + `pnpm-lock.yaml`)
- [x] T002 [P] Adicionar script de teste em `package.json`: `"test": "node --experimental-strip-types --test"` (Node 22+; imports relativos nos testes)
- [x] T003 Criar esqueleto de pastas: `src/shared/{primitives,http,ports,utils,ui}`, `src/external/{config,core-api}`, `src/routes`, e `tests/` espelhando `src/` (+ `src/shared/ui/README.md` placeholder)
- [x] T004 Bootstrap mínimo TanStack Start (sem QueryClient): `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`. Validar `http://localhost:3000/` renderiza

---

## Phase 2: Foundational (Blocking Prerequisites) — primitivos vendorizados (TDD)

**Purpose**: `shared/primitives` (cópia fiel do core-api, R8) — base de TODA outra camada.

**⚠️ CRITICAL**: nenhuma story avança sem isto.

### Tests (TDD — vendorizar/ver falhar primeiro)

- [x] T005 [P] Vendorizar teste de `Result` → `tests/shared/primitives/result.test.ts` (de `core-api/tests/shared/result.test.ts`)
- [x] T006 [P] Vendorizar teste de `Brand` → `tests/shared/primitives/brand.test.ts` (de `core-api/tests/shared/brand.test.ts`)
- [x] T007 [P] Vendorizar teste de imutabilidade → `tests/shared/primitives/immutable.test.ts` (de `core-api/tests/shared/immutable.test.ts`)

### Implementation (green)

- [x] T008 [P] Vendorizar `Result<T,E>` → `src/shared/primitives/result.ts` (cópia fiel; `.ok` + `ok`/`err`/`isOk`/`isErr`/`mapErr`/`combine`)
- [x] T009 [P] Vendorizar `Brand<T,K>` → `src/shared/primitives/brand.ts` (`unique symbol __brand` + `BrandOf`; **remover** `// eslint-disable @typescript-eslint/naming-convention` órfão)
- [x] T010 [P] Vendorizar `immutable`/`deepImmutable` → `src/shared/primitives/immutable.ts`

**Checkpoint**: `node --test` verde nos primitivos — US2 pode começar.

---

## Phase 3: User Story 2 - `shared/http` (Priority: P1) — TDD

**Goal**: cadeia de erro (`HttpError`, `AppError`, `QueryError`) + `map-to-app-error` + parser do envelope real.

**Independent Test**: mapear cada variante de `HttpError` → `AppError` (por status, conforme `contracts/error-envelope.md`), parsear o envelope, e checar `QueryError`.

### Tests (TDD — escrever/ver falhar primeiro) ⚠️ perguntar tipo (unit/BDD)

- [x] T011 [US2] Teste de `parseErrorEnvelope` → `tests/shared/http/error-envelope.test.ts` (envelope válido, parcial, não-objeto → null)
- [x] T012 [US2] Teste de `map-to-app-error` → `tests/shared/http/map-to-app-error.test.ts` (cada variante de HttpError + status 401/403/404/409/400/5xx → AppError esperado)
- [x] T013 [US2] Teste de `QueryError` → `tests/shared/http/query-error.test.ts` (`isQueryError`, carrega `AppError`, `name`)

### Implementation (green)

- [x] T014 [P] [US2] `HttpError` → `src/shared/http/http-error.types.ts` (network | http{status,body} | parse | timeout | aborted)
- [x] T015 [P] [US2] `AppError` → `src/shared/http/app-error.types.ts` (auth:expired | auth:forbidden | not-found | validation{issues} | conflict | server | connectivity | bad-gateway | unknown{status?})
- [x] T016 [US2] `parseErrorEnvelope` → `src/shared/http/error-envelope.ts` (narrowing seguro, sem throw) — green p/ T011
- [x] T017 [US2] `map-to-app-error` → `src/shared/http/map-to-app-error.ts` (`switch` por status + guarda `never`; extrai code/message/requestId) — green p/ T012 (depende T014, T015, T016)
- [x] T018 [US2] `QueryError` → `src/shared/http/query-error.ts` (única subclasse de `Error`; `isQueryError`) — green p/ T013 (depende T015)

**Checkpoint**: cadeia de erro modelada e verde — US3 pode começar.

---

## Phase 4: User Story 3 - `external/` (Priority: P1) — TDD

**Goal**: cliente HTTP `Result`-based (timeout/abort), tradutor que preserva status, config fail-fast server-only.

**Independent Test**: `fetch` stubado (2xx/4xx/5xx/timeout/abort/204) sempre retorna `Result`; config falha sem `CORE_API_URL`.

### Tests (TDD — escrever/ver falhar primeiro) ⚠️ perguntar tipo (unit/BDD)

- [x] T019 [US3] Teste de `env.config` → `tests/external/config/env.config.test.ts` (fail-fast sem `CORE_API_URL`; aceita URL válida)
- [x] T020 [US3] Teste de `result-fetch` → `tests/external/core-api/result-fetch.test.ts` (stub `globalThis.fetch`: 200/JSON, 404, 500, timeout, abort, 204, corpo vazio, não-JSON → sempre `Result`)
- [x] T021 [US3] Teste de `map-to-server-response` → `tests/external/core-api/map-to-server-response.test.ts` (cada variante → status: http→original, network/timeout→504, parse→502, aborted→499)

### Implementation (green)

- [x] T022 [US3] `env.config` → `src/external/config/env.config.ts` (Zod, fail-fast, **server-only** — sem `VITE_`, nunca em client/UI; expõe `CORE_API_URL`) — green p/ T019
- [x] T023 [US3] `result-fetch` → `src/external/core-api/result-fetch.ts` (`globalThis.fetch` → `Result<T,HttpError>`; `AbortController`+timeout 10s; `token?`; leitura segura; 204→ok(undefined)) — green p/ T020 (depende T008, T014)
- [x] T024 [US3] `map-to-server-response` → `src/external/core-api/map-to-server-response.ts` (preserva status; guarda `never`) — green p/ T021 (depende T014)

**Checkpoint**: ponte com o backend verde — US1 pode fechar a cadeia.

---

## Phase 5: User Story 1 - App rodável + cadeia ligada (Priority: P1) 🎯 MVP — TDD

**Goal**: completar o composition root — `/health` própria + QueryClient (401→signOut + invalidação). Fecha FR-002 e FR-019.

**Independent Test**: `/` e `/health` respondem; `QueryError(auth:expired)` dispara clear+redirect; `pnpm build` conclui.

### Tests (TDD — escrever/ver falhar primeiro) ⚠️ perguntar tipo (unit/BDD/smoke)

- [x] T025 [US1] Teste da rota `/health` → `tests/routes/health.test.ts` (responde/exibe `{status:'ok'}`)
- [x] T026 [US1] Teste da política do QueryClient → `tests/router/query-client.test.ts` (`onError` com `QueryError(auth:expired)` → `clear()` + navigate; `onSuccess` → invalidate)

### Implementation (green)

- [x] T027 [US1] `src/routes/health.tsx` — rota `/health` do front → `{status:'ok'}` (FR-002) — green p/ T025
- [x] T028 [US1] Configurar `QueryClient` em `src/router.tsx` — `QueryCache.onError` (auth:expired → `clear()` + `navigate /auth/login {redirect}`) + `MutationCache.onSuccess` (`invalidateQueries`) — green p/ T026 (depende T017, T018)
- [x] T029 [US1] `QueryClientProvider` em `src/routes/__root.tsx` + expor `queryClient` no router context (depende T028)

**Checkpoint**: app de pé, health OK, cadeia server→ui demonstrável (FR-019).

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T030 [P] (OPCIONAL — C1) `src/shared/ports/session-store.port.ts` apenas como contrato (type), terreno p/ feature Auth
- [x] T031 Verificar **env server-only** (SC-005/FR-015): inspecionar bundle do browser (`pnpm build`) — `CORE_API_URL`/segredos não vazam
- [x] T032 Quality gate: `pnpm lint` (boundaries + MVVM) · `pnpm typecheck` · `node --test` · `pnpm build` — todos verdes
- [x] T033 Validar `quickstart.md` ponta-a-ponta (dev local OU dockerizado): `/` e `/health`; `CORE_API_URL` conforme o modo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências. T004 entrega app mínimo rodável.
- **Foundational (Phase 2)**: depende do Setup; bloqueia US2/US3/US1.
- **US2 (Phase 3)**: depende de Foundational (`Result`).
- **US3 (Phase 4)**: depende de Foundational + US2 (`HttpError`).
- **US1 (Phase 5)**: wiring do QueryClient depende de US2 (`QueryError`/`map-to-app-error`).
- **Polish (Phase 6)**: depende das stories concluídas.

### Regra TDD (dentro de cada unidade)

1. **Perguntar ao usuário o tipo de teste** (unitário/BDD).
2. Escrever o teste e **vê-lo falhar** (red).
3. Implementar o mínimo até **passar** (green).
4. Refatorar mantendo verde.

### Parallel Opportunities

- Setup: T001, T002 em paralelo.
- Foundational: testes T005-T007 em paralelo; impl T008-T010 em paralelo (após seus testes).
- US2: testes T011-T013; tipos T014/T015 em paralelo; depois T016/T017/T018.
- US3: testes T019-T021 em paralelo; impl T022-T024.

---

## Implementation Strategy

### MVP (mínimo demonstrável)

1. Phase 1 Setup → `pnpm dev` sobe. **VALIDAR** `http://localhost:3000/`.
2. Phase 2 Foundational (TDD) → primitivos verdes.
3. Phases 3–4 (US2, US3, TDD) → cadeia de erro + ponte HTTP.
4. Phase 5 (US1, TDD) → `/health` + QueryClient → cadeia fim-a-fim (FR-019).
5. **STOP e VALIDAR** com `quickstart.md`.

### Entrega incremental

Setup+Foundational → + US2 → + US3 → + US1 → Polish. Cada incremento testado antes do próximo.

---

## Notes

- `routeTree.gen.ts` é **gerado** pelo plugin do TanStack Start (já ignorado por eslint/boundaries) — não editar à mão.
- Hook `eslint --fix` dispara ao editar `*.ts/*.tsx`; `npm`/`yarn` bloqueados (use pnpm).
- Commit após cada par teste→impl (ou grupo lógico), seguindo a convenção do projeto.
- US2/US3 violam levemente a "independência" ideal (fundação é layered) — documentado; não é regressão.
