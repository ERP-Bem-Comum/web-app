# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

> **Variante `-fe` (frontend / web-app).** Preenchida pelo `/speckit-plan`. Adapta o `plan-template.md`
> (core-api) ao **front + BFF** (TanStack Start): troca Migrations Drizzle / Contrato Fastify / W0-size
> pelas seções de **server functions**, **módulo vertical client×server** e **design system**.

## Summary

[Requisito primário (da spec) + abordagem técnica (do research). 3-5 linhas.]

## Technical Context

**Language/Version**: TypeScript estrito (6→7, `erasableSyntaxOnly`) · Node [versão]
**Meta-framework**: Vite + `@tanstack/react-start` (SSR + server functions) · `@tanstack/react-router`
**Server-state**: TanStack Query · **Validação**: Zod 4 (na borda) · **UI**: React 19
**Design System**: vanilla-extract (zero-runtime), tokens-only (`vars.*`) — ADR-0007
**Testes**: `node:test` (puro: domain/application/view-model/data) + Vitest/jsdom (DOM: page/component/binding)
**Storage**: N/A no front — estado remoto no TanStack Query; segredos/sessão server-only (`external/`)
**Target Platform**: navegador moderno + BFF Node (preset Nitro node-server)
**Project Type**: web app (front + BFF unificado, módulos verticais)
**Performance Goals**: [ex.: lista p95 < 1s @ N itens; TTI da rota < Xs]
**Constraints**: [ex.: token nunca no browser; CSP/HSTS; sem libs além do necessário]
**Scale/Scope**: [nº de telas/rotas, entidades, server functions]

## Constitution Check

*GATE: passar antes da Fase 0. Re-checar após a Fase 1.* Princípios I–XII (`.specify/memory/constitution.md`
do **frontend** — v1.3.0; se o working tree estiver com a do core-api, usar a versão do frontend de HEAD/handbook).

| Princípio | Aderência | Nota |
|---|---|---|
| I. BFF-Orchestrated Boundary | [✓/✗] | browser só fala com server fn; token server-only |
| II. Errors Are Values | [✓/✗] | `Result<T,E>`; `throw` só na borda; `QueryError` única `Error` |
| III. Client×Server Modular | [✓/✗] | módulo vertical; cross-módulo só via `public-api`; boundaries de lint |
| IV. Illegal States Unrepresentable | [✓/✗] | branded types + smart constructors; unions + switch exaustivo |
| V. Server-State ≠ UI-State | [✓/✗] | remoto no Query; UI em reducer/máquina |
| VI. Validation at the Boundary | [✓/✗] | Zod no input da server fn E no response core-api E no Model do client |
| VII. Strict TS 6→7 | [✓/✗] | sem enum/namespace/parameter-props; union+`as const` |
| VIII. Minimal Dependencies | [✓/✗] | preferir nativo (Intl/crypto/EventTarget) |
| IX. pnpm Only | [✓/✗] | — |
| X. Spec-Driven | [✓/✗] | esta spec versionada; decisões → ADR |
| XI. Framework-Agnostic Client (MVVM) | [✓/✗] | view-model puro; binding = adapter; views burras |
| XII. Reactive Flow via Event Bus | [✓/✗] | eventos = fatos no passado; bus opt-in |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── discovery.md          # Fase 0 (elicitação)
├── spec.md               # o quê
├── api-readiness-report.md
├── domain.md             # bounded context + agregados (citação ACDG)
├── adr/                  # decisões (citação ACDG)
├── metrics.md            # NFRs (citação ACDG)
├── plan.md               # este arquivo
├── research.md · data-model.md · quickstart.md · contracts/
└── design-system/        # 00-interface-inventory … 07-governance (Atomic Design)
```

### Source Code (módulo vertical — espelha `auth`/`contracts`)

```text
src/modules/<m>/
├── server/                         # BFF · DDD · onde o token vive
│   ├── domain/                     #   PURO: VOs branded, Result, errors, ports, events
│   ├── application/                #   use-cases (commands/queries) — sem throw
│   └── adapters/                   #   *.server-fn.ts (★ fronteira) + core-api client + *.schema.ts (Zod)
├── client/                         # FRONT · MVVM · agnóstico (ADR-0009) — feature-first FLAT
│   ├── data/                       #   *.model.ts (Zod) + *.repository.ts (porta→server fn) + events/
│   ├── domain/                     #   use-cases compartilhados (opcional)
│   └── <comportamento>/            #   camada=SUFIXO: *.mutation/*.view-model (puro) + *.binding/*.page/*.component/*.controller (adapter)
└── public-api/index.ts             # ★ único import externo
```

**Structure Decision**: [estrutura escolhida + referência às pastas reais].

## Server Functions & Contratos do BFF *(a fronteira — Princ. I)*

> Substitui "Contrato HTTP (Fastify)". A server function é a única fronteira client↔server.

| Server fn (`*.server-fn.ts`) | Tipo | Input (Zod) | Output | core-api consumido |
|---|---|---|---|---|
| [`listX`] | query | [schema] | `Result`→Response | [`GET /api/vN/x`] |
| [`createX`] | mutation | [schema] | [...] | [`POST ...`] |

- **Cadeia de erro** (Princ. II/V): core-api 4xx/5xx → `resultFetch`→`HttpError` → `mapToServerResponse` →
  `queryFn` lança `QueryError(mapToAppError)` → `switch` em `AppError.kind` → tag i18n. A UI nunca olha status HTTP.

## Integração core-api *(prontidão)*

> Resumo do `api-readiness-report.md`: o que integra real agora vs. mock/fallback. Ponto de troca = gateway/repository.

| Capacidade | Prontidão | Estratégia Fase 1 |
|---|---|---|
| [X] | 🟢/🟡/🔴 | [real / mock / fallback] |

## Design System Impact *(Atomic Design — ADR-0007, design-system só-tokens)*

- **Tokens**: [usa existentes de `shared/ui/tokens` · novos? — proibido hex/px cru em `ui/`]
- **Átomos/Moléculas/Organismos novos**: [listar; ver `design-system/02..04`]
- **Templates/Pages**: [telas compostas; ver `design-system/05..06`]

## Data Model (client × server)

- **server/domain**: [agregados + VOs branded + invariantes]
- **client/data Model**: [Zod do retorno do BFF — o que a UI consome]
- Detalhe em `data-model.md`.

## Plano de Testes (TDD)

- **Puro (`node:test`, imports relativos)**: domain (VOs/regras), application (use-cases c/ fakes),
  view-model (derivações/commands), data (repository/model).
- **DOM (Vitest/jsdom, aliases ok)**: `*.page`/`*.component`/`*.binding`/`*.controller`.
- **Escreva o teste antes** (Princ. X). Liste as suites que falham primeiro (RED).

## Complexity Tracking

> Preencher só se o Constitution Check tiver violações a justificar.

| Violação | Por que necessária | Alternativa simples rejeitada porque |
|---|---|---|
| [...] | [...] | [...] |
