# Implementation Plan: Municípios parceiros adicionados (cross-state)

**Branch**: `feat/municipalities-user-photo-024` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/024-municipalities-user-photo/spec.md`

> **Escopo reduzido (2026-06-11):** o pacote nasceu com 2 user stories; a US2 (foto de perfil) foi
> **removida** porque a **exibição** da foto está bloqueada no backend (ver
> `handbook/core-api/tickets/USR-ME-PHOTO-DISPLAY.md`). Este plano cobre **apenas US1 — municípios
> cross-state (§1.8)**. Nome de branch/pasta mantido por histórico.

## Summary

Ligar o painel **"Municípios Parceiros Adicionados"** (hoje placeholder `municipalitiesAddedPending`) ao
endpoint já entregue pelo backend `GET /partner-municipalities/added` (cross-state), espelhando exatamente
o painel **"Estados Parceiros Adicionados"**: nova **server function** (acumula páginas, valida Zod na
borda, mapeia para `PartnerMunicipality[]`), método de **repository**, **query key + options**, e
derivação de um **`GeoPanel`** no binding (lista + busca client-side + contador), removendo o placeholder
na page. A "Lista Geral" por UF não muda — só passa a **invalidar** também a query do cross-state após
add/remove. Frontend-only, aditivo, sem tocar core-api.

## Technical Context

**Language/Version**: TypeScript strict (erasableSyntaxOnly), React 19.

**Primary Dependencies**: TanStack Start (Vite+Nitro), TanStack Query, Zod 4, vanilla-extract.

**Storage**: N/A (consome BFF → core-api; sem persistência no front).

**Testing**: `node:test` (`*.test.ts`, imports `#`) para mapeador puro; Vitest+jsdom (`*.spec.tsx`) para o painel.

**Target Platform**: Web (app unificado front+BFF).

**Project Type**: Web app modular vertical (módulo `partners`, recurso `geography`).

**Performance Goals**: lista cross-state utilizável com dezenas–centenas de itens (busca/contagem client-side).

**Constraints**: invariantes v2 (lint cobra); server function = única fronteira; sem regressão.

**Scale/Scope**: 1 painel ligado; ~6 arquivos de front tocados/criados; sem mudança de core-api.

## Constitution Check

*GATE: frontend v2 — esta feature não governa `src/` do core-api; aplica as invariantes do front.*

- **Erros como valores** (`Result<T,E>`, sem throw fora da borda): ✅ server fn e repository devolvem `Result`.
- **Sem `any`/`class`/`this`; imutabilidade**: ✅ tipos `Readonly`, mapeadores puros.
- **Server function = única fronteira client↔server**: ✅ nova query fn; browser não fala com core-api.
- **Zod na borda (response do core-api)**: ✅ `AddedMunicipalitiesPagedSchema` valida o `/added`.
- **Views burras (MVVM)**: ✅ `useQuery` só no binding; page/component permanecem burros.
- **Boundaries por `public-api`**: ✅ nova fn exportada no `partners/public-api`.
- **Só-tokens / i18n / naming postfix**: ✅ sem CSS novo (reusa `territory-column.css.ts`); tags i18n já
  existentes; arquivos com postfix (`.query.fn.ts`, `.repository.ts`, etc.).
- **Switch exaustivo `never`**: ✅ `GeoPanel` já é union discriminada tratada no `toColumnState`.

**Resultado:** PASS, sem violações. (Complexity Tracking não se aplica.)

## Project Structure

### Documentation (this feature)

```text
specs/024-municipalities-user-photo/
├── plan.md              # Este arquivo
├── research.md          # Decisões D1–D6
├── data-model.md        # Tipos + transformações
├── quickstart.md        # Validação em tela
├── contracts/
│   └── added-municipalities.md
├── checklists/
│   └── requirements.md
└── tasks.md             # (gerado pelo /speckit-tasks)
```

### Source Code (repository root)

```text
src/modules/partners/
├── server/adapters/
│   ├── server-fns/geography/
│   │   └── list-added-municipalities.query.fn.ts        # NOVO — acumula páginas + Zod + mapeia
│   └── core-api/ (ou geography.io-schemas / mapper da geografia)
│       └── *.schema.ts                                  # NOVO/EDIT — AddedMunicipalitiesPagedSchema
├── client/
│   ├── data/repository/
│   │   ├── geography.repository.ts                      # EDIT — + listAddedMunicipalities()
│   │   └── geography.repository.instance.ts             # EDIT — injeta a nova fn
│   └── geography/
│       ├── geography.query.ts                           # EDIT — addedMunicipalitiesQueryKey/Options
│       ├── geography.binding.ts                         # EDIT — municipalitiesAdded: GeoPanel + invalidação
│       └── page/geography.page.tsx                      # EDIT — render real (remove placeholder)
└── public-api/index.ts                                  # EDIT — export listAddedMunicipalitiesFn

tests/modules/partners/
├── client/data/repository/geography.repository.test.ts  # EDIT/NOVO — mapeador /added (node:test)
└── client/geography/added-municipalities.spec.tsx        # NOVO — painel lista/busca/contador/vazio (vitest)
```

**Structure Decision**: módulo vertical `partners`/`geography` (split client×server já existente). Não toca
outros módulos. Único arquivo possivelmente compartilhado seria `catalog.pt-BR.ts` — mas a feature **reusa**
tags i18n existentes (sem adicionar), então provavelmente nem o catálogo muda.

## Complexity Tracking

N/A — Constitution Check passou sem violações.

## Migrations Drizzle (core-api)

- **Mudanças de schema**: [x] **nenhuma** (frontend-only; consome endpoint existente).

## Contrato HTTP (Fase 2+)

N/A — não altera o core-api. O contrato consumido (`GET /partner-municipalities/added`) já existe (#32) e
está documentado em `contracts/added-municipalities.md`.

## Estimativa de Pipeline (W0 size)

- **Tamanho**: [x] **S/M** — fatia pequena/localizada (ligar 1 painel a 1 endpoint, espelhando Estados).
- **Justificativa**: ~6 arquivos de front, 1 server fn nova, sem core-api, sem CSS, reuso de componente burro.
- **Plano de testes W0 (RED)**:
  - `geography.repository.test.ts` (node): `listAddedMunicipalities()` mapeia `{items,meta}` → 
    `PartnerMunicipality[]` (`isPartner:true`, ordenado UF→nome), acumula 2 páginas, propaga erro como `Result`.
  - `added-municipalities.spec.tsx` (vitest): painel renderiza itens (nome+UF), filtra por busca, mostra
    contador e estado vazio. Deferir partes frágeis no jsdom com justificativa.
