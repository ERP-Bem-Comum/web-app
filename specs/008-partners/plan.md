# Implementation Plan: Gestão de Parceiros (`partners`)

**Branch**: `008-partners` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-partners/spec.md`

> Plano do épico `partners` (front + BFF). Consolida `domain.md`, `adr/`, `metrics.md` e
> `api-readiness-report.md`. Constitution Check contra a constituição do **frontend** (v1.3.0, I–XII).

## Summary

Criar o módulo vertical `src/modules/partners/` espelhando `contracts`/`auth` (split `server/` DDD ×
`client/` MVVM agnóstico), entregando os sub-domínios da Gestão de Parceiros como capacidades
independentes: Colaboradores, Fornecedores, Financiadores, Estados, Municípios e **ACT** (4º tipo,
reaberto como US6 após a PR #20/#22 do core-api). Integração com o `core-api` (`/api/v1`) é **real em toda
a superfície** — a Rev. 2/3 do `api-readiness-report.md` confirmou que o backend cobre tudo (incl.
import/export, território, agregador `/partners` e CRUD de ACT). O **ponto de troca** (gateway/repository)
permanece isolado por princípio (ADR-0001), mas **mock não é mais necessário**. Clone fiel do legado,
saneando bugs de borda na anti-corruption layer.

## Technical Context

**Language/Version**: TypeScript estrito (6→7, `erasableSyntaxOnly`) · Node 24
**Meta-framework**: Vite + `@tanstack/react-start` · `@tanstack/react-router` (file-based)
**Server-state**: TanStack Query · **Validação**: Zod 4 (na borda) · **UI**: React 19
**Design System**: vanilla-extract (zero-runtime), tokens-only (ADR-0007)
**Testes**: `node:test` (domain/application/view-model/data) + Vitest/jsdom (page/component/binding)
**Storage**: N/A no front (estado remoto no TanStack Query; sessão/segredos server-only em `external/`)
**Target Platform**: navegador moderno + BFF Node (preset Nitro)
**Project Type**: web app (front + BFF unificado, módulo vertical)
**Performance Goals**: listagem p95 < 1s @ ≤50 itens; TTI rota < 2s (ver `metrics.md`)
**Constraints**: token nunca no browser; só-tokens no `ui/`; i18n; mock isolável no gateway
**Scale/Scope**: 5 sub-domínios, ~12 telas/rotas, ~20 server functions

## Constitution Check

*GATE: passar antes da Fase 0; re-checar após a Fase 1.* Base: constituição do **frontend** v1.3.0 (I–XII).
⚠️ O working tree tem a constituição do core-api no arquivo; a referência válida aqui é a do frontend
(HEAD / `handbook/adr/`). Não revertido por decisão do autor.

| Princípio | Aderência | Nota |
|---|---|---|
| I. BFF-Orchestrated Boundary | ✓ | browser só fala com server fn; core-api (`/api/v1`) atrás do BFF; token server-only |
| II. Errors Are Values | ✓ | `Result<T,E>`; `throw` só na borda; `QueryError` na ponte com Query |
| III. Client×Server Modular | ✓ | `modules/partners/` com split; cross-módulo via `public-api`; boundaries de lint |
| IV. Illegal States Unrepresentable | ✓ | VOs branded (CPF/CNPJ/Email/UF/PixKey) + smart constructors; unions + switch exaustivo |
| V. Server-State ≠ UI-State | ✓ | listas/detalhes no Query; filtros/form em reducer/controller |
| VI. Validation at the Boundary | ✓ | Zod no input da server fn, no response core-api e no Model do client |
| VII. Strict TS 6→7 | ✓ | sem enum/namespace; union + `as const` |
| VIII. Minimal Dependencies | ✓ | nativo p/ CSV parse? avaliar (ver research); evitar libs |
| IX. pnpm Only | ✓ | — |
| X. Spec-Driven | ✓ | esta spec/plan/ADRs versionados |
| XI. Framework-Agnostic Client (MVVM) | ✓ | view-model puro; binding adapter; views burras; dual-panel como organismo |
| XII. Reactive Flow via Event Bus | ✓ (opt-in) | eventos `ColaboradorDesativado`/`FornecedorCriado` em `client/data` |

**Resultado**: PASS — sem violações. Complexidade adicional (mock) é isolada e justificada (ADR-0001).

## Project Structure

### Documentation (this feature)

```text
specs/008-partners/
├── discovery.md · spec.md · api-readiness-report.md
├── domain.md · adr/{0001,0002}.md · metrics.md
├── plan.md (este) · research.md · data-model.md · quickstart.md · contracts/
└── design-system/ (00-interface-inventory … 07-governance)
```

### Source Code (módulo vertical — espelha `contracts`)

```text
src/modules/partners/
├── server/
│   ├── domain/                  # Collaborator/Supplier/Financier (agregados) + VOs branded + errors + events
│   ├── application/             # use-cases: list/get/create/complete/update/deactivate/import por tipo
│   └── adapters/                # *.server-fn.ts (fronteira) + core-api client (/api/v1) + *.schema.ts (Zod) + ACL (saneamento) + mocks
├── client/
│   ├── data/                    # *.model.ts (Zod) + *.repository.ts (porta→server fn) + gateways (real|mock) + events
│   ├── domain/                  # (opcional) helpers compartilhados (ex.: status/format)
│   ├── collaborator-list/ · collaborator-detail/ · collaborator-create/ · collaborator-edit/
│   ├── supplier-*/ · financier-*/
│   └── partner-states/ · partner-municipalities/   # dual-panel
└── public-api/index.ts
```

**Structure Decision**: módulo vertical único `partners`, comportamentos flat (ADR-0009), espelhando o
`contracts` já existente (83 arquivos) como referência de padrões. Estados/Municípios são comportamentos
dual-panel sem sub-rotas.

## Server Functions & Contratos do BFF *(a fronteira — Princ. I)*

| Server fn | Tipo | Input (Zod) | core-api (`/api/v1`) | Prontidão |
|---|---|---|---|---|
| `listCollaborators` | query | filtros + paginação | `GET /collaborators` | 🟢 (programa/idade fora de escopo) |
| `getCollaborator` | query | `{ id }` | `GET /collaborators/:id` | 🟢 |
| `createCollaborator` | mutation | 7 campos | `POST /collaborators` | 🟢 |
| `completeCollaboratorRegistration` | mutation | dados completos | `PATCH /collaborators/:id/complete-registration` | 🟢 |
| `updateCollaborator` | mutation | campos | `PUT /collaborators/:id` | 🟢 |
| `deactivateCollaborator` | mutation | `{ id, reason }` | `POST /collaborators/:id/deactivate` | 🟢 |
| `importCollaborators` | mutation | string CSV (Zod ≤2 MiB) | `POST /collaborators/import` | 🟢 (client `File.text()`→string; server fn repassa `text/csv`) |
| `listSuppliers`/`getSupplier`/`createSupplier`/`updateSupplier`/`deactivateSupplier` | — | — | `/suppliers*` | 🟢 |
| `exportSuppliers` | query | filtros | `GET /suppliers/export` | 🟢 |
| `listServiceCategories` | query | — | `GET /suppliers/service-categories` | 🟢 (39) |
| `listFinanciers`/`getFinancier`/`createFinancier`/`updateFinancier`/`deactivateFinancier` | — | — | `/financiers*` | 🟢 |
| `listPartnerStates`/`togglePartnerState` | — | `{ uf, isPartner }` | `GET /partner-states` · `POST/DELETE /partner-states/:uf` | 🟢 |
| `listMunicipalitiesByUf`/`togglePartnerMunicipality` | — | `{ uf }` / `{ ibgeCode, isPartner }` | `GET /partner-municipalities?uf=` · `POST/DELETE /:ibgeCode` | 🟢 |
| `listActsFn`/`getActFn`/`createActFn`/`updateActFn`/`deactivateActFn`/`reactivateActFn` (US6) | query/mutation | 7 campos · `{ id }` | `/api/v1/acts*` | 🟢 ✅ implementado |
| `exportPartnersFn` | query | `{ resource, search?, active?, categories? }` | `GET /api/v1/{resource}/export` | 🟢 ✅ (passthrough `text/csv`) |
| `searchPartnersFn` (no módulo `contracts`) | query | `{ query?, kind? }` | `GET /api/v1/partners` (agregador) | 🟢 ✅ (1 chamada, ADR-0010) |

- **Cadeia de erro** (Princ. II/V): core-api 4xx/5xx → `resultFetch`→`HttpError` → `mapToServerResponse` →
  `queryFn` lança `QueryError(mapToAppError)` → `switch` em `AppError.kind` → tag i18n. UI nunca olha status HTTP.

## Integração core-api *(prontidão)*

Resumo de `api-readiness-report.md`. Ponto de troca = gateway/repository (ADR-0001).

| Capacidade | Prontidão | Fase 1 |
|---|---|---|
| Financiadores (CRUD, PJ-only) | 🟢 | real |
| Fornecedores (CRUD + export + catálogo 39) | 🟢 | real |
| Colaboradores (CRUD + import `text/csv`) | 🟢 | real (BFF converte multipart→csv) |
| Estados / Municípios (toggles idempotentes) | 🟢 | real (Município por `ibgeCode`; `uf` obrigatório na lista) |
| **ACT** (4º tipo, `/api/v1/acts`) | 🟢 | **real (US6)** — promovido a CRUD completo + export na PR #20; server implementado (2026-06-07) |
| Agregador `GET /partners` · Export CSV (4 tipos) | 🟢 | real — `searchPartnersFn` (1 chamada) e `exportPartnersFn` (passthrough) |
| Financiador-PF · filtros programa/idade | ⚪ | fora de escopo (decididos; RBAC **resolvido** — `/me` expõe `permissions[]`) |

## Design System Impact *(Atomic Design — ADR-0007, só-tokens)*

- **Tokens**: reusar `shared/ui/tokens` (cores brand/accent observadas). Ver `design-system/01`.
- **Átomos/Moléculas/Organismos**: ver `design-system/02..04`. Novos organismos prováveis: `DataTable`,
  `FilterPanel`, `FormCard` (1/2/3 seções), `DualPanel`, `DeactivateModal` (com/sem Motivo).
- **Templates/Pages**: `ListTemplate`/`DetailTemplate`/`DualPanelTemplate`; pages = telas reais (ver `05`/`06`).

## Data Model (resumo — detalhe em `data-model.md`)

- **server/domain**: agregados Collaborator/Supplier/Financier + VOs branded; Estado/Município = VO de referência (ADR-0002).
- **client/data Model**: `*ListItem` / `*Detail` (Zod) — o que a UI consome.

## Plano de Testes (TDD)

- **Puro (`node:test`, imports relativos)**: VOs (CPF/CNPJ/UF/PixKey), regras de situação cadastral,
  use-cases (com fakes do core-api client e dos gateways mock), view-models (derivações/commands),
  repositories/models (Zod).
- **DOM (Vitest/jsdom)**: páginas de listagem/detalhe/criar; modal de desativar (Motivo obrigatório);
  dual-panel (add/remove imediato).
- **Escreva o teste antes** (Princ. X). Suites RED iniciais: `tests/modules/partners/**`.

## Complexity Tracking

| Violação | Por que necessária | Alternativa simples rejeitada porque |
|---|---|---|
| Gateway como ponto de troca isolado | Manter SC-005 (UI/ViewModel estáveis) e o princípio do ADR-0001 | Acoplar a UI ao client core-api espalha a borda. **Mock não é mais usado** — o core-api cobre 100% da superfície (collaborators/suppliers/financiers/geography/acts + agregador + export). O gateway permanece como ponto de troca por princípio, não por necessidade. |
