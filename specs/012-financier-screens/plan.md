# Implementation Plan: Telas de Financiadores (partners)

**Branch**: `develop` (feature dir `012-financier-screens`) | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-financier-screens/spec.md`

## Summary

Entregar o `client/` das telas de **Financiadores** no módulo `partners`, espelhando 1:1 o molde
**validado** de Fornecedores (feature 010, `partners/client/supplier-*`). O server-side está pronto
(6 server-fns + contratos `financier.io.ts`) e **já exportado** no `public-api`. O trabalho é só
front: camada `client/data` (model + repository + instance), `client/domain` (tipos + schemas de
form/search), as 4 telas (list/create/detail/edit) com views burras + view-models agnósticas, 4
rotas file-based, o subitem de menu com `financier:read`, e as tags i18n `partners.financiers.*`.
**Diferenças do supplier**: financiador é PJ-only com 6 campos, **sem** categorias de serviço
(`listServiceCategoriesFn`) e **sem** dados de pagamento/PIX; sem coluna de e-mail.

## Technical Context

**Language/Version**: TypeScript strict (migração 6→7, `erasableSyntaxOnly`)

**Primary Dependencies**: React 19, TanStack Start/Router/Query, vanilla-extract, Zod 4 (nenhuma nova dep)

**Storage**: N/A no client (estado remoto via TanStack Query; sem persistência local)

**Testing**: `node:test` (puro: view-models, repository, schemas) + Vitest/jsdom (componentes/UI)

**Target Platform**: Web (front + BFF unificado TanStack Start)

**Project Type**: Web application — módulo vertical `partners`, camada `client` (MVVM §XI)

**Performance Goals**: N/A específico — listagem paginada (default 5/página) já limita payload

**Constraints**: views burras (page/component sem data-hooks), view-models sem React, só-tokens
no `ui/`, erros→tag i18n, boundaries de import (`client/data` toca `server/adapters`; `client/domain`
e `client/data` não importam `server/domain` nem `public-api`), strings de UI = tags i18n

**Scale/Scope**: ~30–35 arquivos novos (espelho do supplier) + 4 rotas + 1 subitem de menu + tags i18n

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Vertical-Modular / Isolamento**: ✅ Tudo dentro de `partners/client`. `client/data` importa as
  server-fns **direto de `server/adapters`** (a fronteira permitida §I/§III), define seus próprios
  tipos (`client/data/model`) e `PartnersError` local — não importa `server/domain` nem `public-api`.
  Rotas (composition root) importam as pages direto do módulo. Espelha o supplier.
- **III. Server fn é a única fronteira**: ✅ O browser nunca fala com o core-api; consome só os
  server-fns existentes via repository injetado (`.instance.ts`).
- **IV. Estados ilegais irrepresentáveis**: ✅ `activation` = união `'active' | 'inactive'`; status do
  detalhe via discriminated state; schemas Zod na borda do form.
- **V. Cadeia de erro fim-a-fim**: ✅ `PartnersError` (string union) → tag i18n via `partners-error-tag`;
  a UI nunca olha status HTTP.
- **IX. Segurança / RBAC**: ✅ `can(granted, 'financier:read'|'financier:write')` esconde/desabilita
  ações; menu por `financier:read` (mecânica da 011). `edit-sensitive` não se aplica (sem campos sensíveis).
- **X. Design system só-tokens**: ✅ `*.css.ts` usam `vars.*`; reusa organismos `DataTable`/`PageHeader`.
- **XI. MVVM / views burras / server-state≠ui-state**: ✅ `*.page.tsx`/`*.component.tsx` sem `useQuery`/
  `useMutation`/`useReducer`; query/mutation na view-model/binding; `*-view.ts` derivação pura.

**Resultado do gate**: PASS — sem violações. *Complexity Tracking* não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/012-financier-screens/
├── plan.md · research.md · data-model.md · quickstart.md
├── checklists/requirements.md
└── tasks.md   (Phase 2 — /speckit-tasks)
```

### Source Code (repository root) — espelho do supplier

```text
src/modules/partners/client/
├── domain/
│   ├── financier.types.ts                 # tipos de UI (FinancierListItem/Detail reexpostos p/ client)
│   └── financier.schemas.ts               # Zod: search params da lista + form (6 campos, CNPJ máscara)
├── data/
│   ├── model/financier.model.ts           # FinancierListInput/Response/Detail/WriteInput (tipos locais)
│   └── repository/
│       ├── financier.repository.ts         # porta (fns injetadas) → Result; PartnersError local
│       └── financier.repository.instance.ts# wire das 6 server-fns reais (de server/adapters)
├── financier-list/
│   ├── financier-list.query.ts · .view-model.ts · .binding.ts
│   ├── page/financier-list.page.tsx (+ .css.ts)
│   └── components/ (financier-filters .component/.controller/.css · financier-paginator .component/.css)
├── financier-create/
│   ├── financier-create.mutation.ts · .view-model.ts · .binding.ts
│   ├── page/financier-create.page.tsx (+ .css.ts)
│   └── components/ (financier-form .component/.controller/.css)
├── financier-detail/
│   ├── financier-detail.query.ts · .view-model.ts · .binding.ts · financier-status.mutation.ts
│   ├── page/financier-detail.page.tsx (+ .css.ts)
│   └── components/ (confirm-dialog espelhado · financier-detail-content .component/.css)
└── financier-edit/
    ├── financier-edit.mutation.ts · .view-model.ts · .binding.ts
    ├── page/financier-edit.page.tsx (+ .css.ts)
    └── components/ (financier-edit-form.component)

src/routes/_authenticated/parceiros/financiadores/
├── index.tsx · criar.tsx · $id.tsx · $id.editar.tsx     # cada uma regenera routeTree.gen.ts

src/modules/shell/client/data/menu/shell-menu.config.ts  # + subitem "Financiadores" (financier:read)
src/shared/i18n/catalog.pt-BR.ts                          # + tags partners.financiers.*

tests/modules/partners/...                                # espelha as suites do supplier (puros + DOM)
```

**Structure Decision**: Replicar a árvore `supplier-*` para `financier-*`, reusando helpers
compartilhados de `client/data` (`can`, `partners-error-tag`) e os organismos `DataTable`/`PageHeader`.
Omitir o que não existe em financier: categorias de serviço (`listServiceCategoriesFn`) e coluna e-mail.

## Complexity Tracking

> N/A — Constitution Check passou sem violações.

## Migrations Drizzle (core-api)

- **Mudanças de schema**: [x] nenhuma — feature 100% frontend.

## Contrato HTTP (Fase 2+)

N/A — nenhuma borda nova. Consome os 6 server-fns existentes (`financier.io.ts` é a fonte dos contratos).

## Estimativa de Pipeline (W0 size)

- **Tamanho**: [x] **M** (replicação de molde validado em ~30–35 arquivos; sem lógica nova de domínio).
- **Justificativa**: zero risco arquitetural (molde 010 validado, server pronto); esforço é volume
  mecânico de espelhamento + i18n + rotas, com TDD por camada.
- **Plano de testes W0 (RED)**: por camada, espelhando o supplier —
  (1) `financier.repository` (puro): mapeia `{ok,data|error}` → `Result`/`PartnersError`;
  (2) `financier-list.view-model` (puro): deriva filtros/colunas/estado vazio;
  (3) `financier-create/edit.view-model` (puro): validação do form + navegação pós-save;
  (4) `financier-detail.view-model` (puro): status ativo/inativo + gating `canWrite`;
  (5) DOM (Vitest): form, filtros, paginador, confirm-dialog.
