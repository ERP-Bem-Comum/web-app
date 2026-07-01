# Implementation Plan: Módulo Plano Orçamentário (Planejamento + Consolidado ABC)

**Branch**: `041-plano-orcamentario-reproducao` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/041-plano-orcamentario-reproducao/spec.md` + `HANDBOOK-plano-orcamentario-mapa.md` (Apêndice B = contratos do legado).

## Summary

Novo módulo vertical `src/modules/budget-plans/` que reproduz o Plano Orçamentário do legado (Planejamento +
Consolidado ABC). O BFF (server functions) orquestra o core-api (a implementar) e entrega respostas completas por
caso de uso; o client MVVM apresenta. O front **adianta** o que independe do backend: `*.model.ts` (Zod), branded
VOs (`Cents`, `Month`), enums, validações, e **funções puras de preview** dos 4 cálculos (espelham
`calc-total-value-result.ts`, em centavos). Entrega **fatiada por PR** (P1→P4), cada tela gateada pela prontidão do endpoint.

## Technical Context

**Language/Version**: TypeScript estrito (`erasableSyntaxOnly`) · Node (preset Nitro node-server)
**Meta-framework**: Vite + `@tanstack/react-start` · `@tanstack/react-router` · **Server-state**: TanStack Query
**Validação**: Zod 4 (borda) · **UI**: React 19 · **Design System**: vanilla-extract tokens-only (ADR-0007)
**Testes**: `node:test` (puro) + Vitest/jsdom (DOM)
**Project Type**: web app (front + BFF unificado, módulo vertical espelhando `auth`)
**Performance Goals**: lista p95 < 1s @ 200 planos; preview de cálculo instantâneo (< 16ms/recalc)
**Constraints**: token nunca no browser; valores em **centavos** (bigint) ponta-a-ponta; zero-mock em produção
**Scale/Scope**: 4 rotas · ~6 entidades · ~18 server functions · 4 modelos de cálculo

## Constitution Check

_GATE: passar antes da Fase 0; re-checar após Fase 1._ (constituição do frontend v1.3.0)

| Princípio                            | Aderência | Nota                                                                                              |
| ------------------------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| I. BFF-Orchestrated Boundary         | ✓         | browser só fala com `*.server-fn.ts`; core-api atrás do BFF                                       |
| II. Errors Are Values                | ✓         | `Result<T,E>` no domain/application; `throw` só na borda; `QueryError` única `Error`              |
| III. Client×Server Modular           | ✓         | módulo vertical; consumo de `programs`/`financial` só via `public-api`                            |
| IV. Illegal States Unrepresentable   | ✓         | branded `Cents`/`Month(1-12)`; união discriminada por `releaseType` + `switch` exaustivo          |
| V. Server-State ≠ UI-State           | ✓         | planos/orçamentos no Query; estado de edição/modais em reducer/máquina                            |
| VI. Validation at the Boundary       | ✓         | Zod no input da server fn, no response do core-api e no Model do client                           |
| VII. Strict TS 6→7                   | ✓         | sem `enum`/`namespace`; unions `as const`; sem parameter-props                                    |
| VIII. Minimal Dependencies           | ✓         | `Intl.NumberFormat` p/ moeda; nada novo além do stack                                             |
| IX. pnpm Only                        | ✓         | —                                                                                                 |
| X. Spec-Driven                       | ✓         | esta spec/plan versionados; decisões macro já em `RESPOSTA-techlead-…`; ADR do preview de cálculo |
| XI. Framework-Agnostic Client (MVVM) | ✓         | preview/derivações em `*.view-model.ts` puro; views burras; binding = adapter                     |
| XII. Reactive Flow via Event Bus     | ✓         | `BudgetPlanApproved`/`BudgetSaved` (passado, EN) invalidam namespaces do Query                    |

**Decisão que vira ADR**: _"Preview de cálculo no client espelhando o backend"_ — funções puras determinísticas
(em centavos) para UX instantânea, com o **backend como fonte de verdade** no submit (teste de equivalência garante paridade).

## Project Structure

### Source Code (módulo vertical — espelha `auth`)

```text
src/modules/budget-plans/
├── server/
│   ├── domain/        # VOs branded (Cents, Month, Version), enums, Result/errors, ports, events
│   ├── application/   # use-cases: listPlans, createPlan, getPlanDetail, saveResult, approve, scenery, calibrate, delete, consolidated, insights
│   └── adapters/      # *.server-fn.ts (fronteira) + core-api client + *.schema.ts (Zod in/out)
├── client/
│   ├── data/          # *.model.ts (Zod) + *.repository.ts (→ server fn) + events/
│   ├── domain/        # calc/ (4 previews puros, em centavos) — compartilhado
│   └── <comportamento>/  # *.view-model.ts (puro) + *.binding/*.page/*.component/*.controller
└── public-api/index.ts
```

**Structure Decision**: módulo vertical único `budget-plans` (o "budgets/budget-results" do legado vira submáquina
interna do mesmo módulo, não um segundo módulo). Rotas em `src/routes/` (file-based router) apontando para as pages do módulo.

## Server Functions & Contratos do BFF _(a fronteira — Princ. I)_

| Server fn                                                           | Tipo     | Input (Zod)                                    | Output                              | core-api (a criar)                           |
| ------------------------------------------------------------------- | -------- | ---------------------------------------------- | ----------------------------------- | -------------------------------------------- | ---- | ----------------- | -------------------- |
| `listBudgetPlans`                                                   | query    | page/limit/search/year/programId/status        | lista raízes + children + parceiros | `GET /budget-plans`                          |
| `createBudgetPlan`                                                  | mutation | year, programId, yearForImport?, scenarioName? | `{id}`                              | `POST /budget-plans`                         |
| `getBudgetPlan`                                                     | query    | id                                             | plano + estrutura                   | `GET /budget-plans/:id`                      |
| `getPlanConsolidatedByNetwork`                                      | query    | id, redeFilter                                 | matriz por rede/mês                 | `GET /budgets?...`                           |
| `manageCostCenters`                                                 | mutation | árvore CRUD                                    | ok                                  | cost-centers endpoints                       |
| `addBudget`                                                         | mutation | planId, estadoId? XOR municipioId?             | `{id}`                              | `POST /budgets`                              |
| `deleteBudget`                                                      | mutation | id                                             | ok                                  | `DELETE /budgets/:id`                        |
| `saveResult`                                                        | mutation | discriminada por releaseType + months[]        | ok                                  | `POST /budget-results/{ipca                  | caed | personal-expenses | logistics-expenses}` |
| `getLastYearResults`                                                | query    | budgetId, subCategoryId                        | base p/ "ano anterior"              | `GET /budget-results/all-last-year/...`      |
| `approvePlan` / `createScenery` / `startCalibration` / `deletePlan` | mutation | id (+name)                                     | `{id}`/ok                           | respectivos                                  |
| `getInsights`                                                       | query    | id                                             | histórico 5 anos + realizado        | `GET /:id/insights` (+ financial CONCILIADO) |
| `getConsolidatedABC`                                                | query    | year, programId[]                              | matriz consolidada                  | `GET /consolidated-result`                   |
| `requestCsv`                                                        | mutation | id/scope                                       | disparo (backend gera)              | `GET /:id/generate-csv`                      |

- **Cadeia de erro** (Princ. II/V): core-api → `HttpError` → `mapToServerResponse` → `QueryError(mapToAppError)` → `switch(AppError.kind)` → i18n. UI nunca olha status HTTP.

## Integração core-api _(prontidão)_

| Capacidade                          | Prontidão                                | Estratégia                                                                                           |
| ----------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Todos os endpoints do módulo        | 🔴 **inexistentes** (só `budgetPlanRef`) | **gate por fatia**: front adianta model/validação/preview; page só integra quando o endpoint existir |
| `programs` (Programa)               | 🟢 existe                                | consumir via `public-api`                                                                            |
| Financeiro `CONCILIADO` (Realizado) | 🟡 existe (financial)                    | expor query no BFF p/ insights                                                                       |

> ⚠️ **Nenhuma page vai a produção sem endpoint** (ADR-0011). Sequência de PRs alinhada à criação dos endpoints no core-api (#113).

## Design System Impact _(Atomic Design — só-tokens)_

- **Tokens**: usar `shared/ui/tokens` (cores primária ciano, verde/cinza/azul de status, spacing). Zero hex/px cru.
- **Moléculas/Organismos candidatos**: `TreeTable` (linhas em árvore expansíveis), `MonthMatrix` (Centro×meses com nav semestral), `CalcGastosPanel` (3 colunas Categoria→Subcategoria→Despesas), `StatusBadge`, `ConfirmDialog`/`ToastInfo`.
- **Pages**: `PlanejamentoListPage`, `PlanoDetalhePage`, `OrcamentoEditPage`, `ConsolidadoABCPage`.

## Data Model (client × server)

- **server/domain**: `Cents` (branded bigint≥0), `Month` (1–12), `BudgetPlanStatus`/`ReleaseType`/`SubCategoryType`/`CostCenterType` (unions `as const`), agregado `BudgetPlan` (invariante: edição só em RASCUNHO/EM_CALIBRACAO; unicidade ano+programa+v1), `Budget` (XOR parceiro), `BudgetResult` (união discriminada por releaseType).
- **client/data Model**: Zod dos retornos do BFF; `BudgetResultData` como união discriminada (inputs por tipo).
- **client/domain/calc**: 4 funções puras `preview{Personal,Ipca,Caed,Logistics}(input): Cents` — cópia 1:1 de `calc-total-value-result.ts`.
- Detalhe em `data-model.md`.

## Plano de Testes (TDD)

- **Puro (`node:test`)**: VOs (`Cents`/`Month` smart constructors), **as 4 fórmulas de preview** (tabela de casos do legado — RED primeiro), view-models (derivação de status/ações, totais mês/ano), repository/model (Zod).
- **DOM (Vitest/jsdom)**: pages/components/bindings das 4 telas + modais (Criar Plano, Calculando Gastos, confirmações).
- **Equivalência preview↔backend**: suíte de casos-fixados garantindo centavos idênticos.

## Complexity Tracking

| Violação                                        | Por que necessária                                        | Alternativa rejeitada                                                                                                |
| ----------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Lógica de cálculo replicada no client (preview) | UX instantânea no lançamento (evita round-trip por tecla) | Só backend: latência ruim na digitação; mitigado por teste de equivalência + backend como fonte de verdade no submit |
