# Implementation Plan: Geografia de Parceria (partners)

**Branch**: `develop` (feature dir `014-geography-screens`) | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

## Summary
Tela de **abrangência territorial** (estados → municípios) com toggle otimista. **Não** segue o molde CRUD
(sem DataTable/form/detail/edit). UI própria de **dois painéis**. Server pronto (4 fns + `geography.io.ts`,
já no public-api). RBAC `geography:read|write`. Rota `/parceiros/territorios`.

## Technical Context
- **Language**: TS strict · **Deps**: React 19, TanStack Query/Router, vanilla-extract, Zod 4 (nenhuma nova)
- **Testing**: node:test (view-model puro) + Vitest/jsdom (lista com toggle)
- **Constraints**: views burras (toggle/seleção via binding), view-model sem React, só-tokens, boundaries, i18n

## Constitution Check — PASS
- §I boundaries · §III server fn única fronteira · §V PartnersError→tag · §IX RBAC geography:* + menu
- §X só-tokens · §XI MVVM (UI-state `selectedUf` no binding; server-state no Query; derivações puras na view-model)
- §IV: `isPartner` boolean; toggle otimista derivado puro. Sem violações.

## Project Structure (UI própria — NÃO espelha CRUD)
```
src/modules/partners/client/
├── data/model/geography.model.ts                 # PartnerState, PartnerMunicipality, inputs
├── data/repository/geography.repository.ts · .instance.ts   # listStates/toggleState/listMunicipalities/toggleMunicipality
└── geography/
    ├── geography.query.ts                         # statesQueryOptions, municipalitiesQueryOptions(uf)
    ├── geography.view-model.ts                     # PURO: sortByUf/byName, applyToggle (otimista), counts
    ├── geography.binding.ts                        # useQuery(states) + useQuery(municipalities,selectedUf)
    │                                               #   + useMutation(toggles, otimista c/ rollback) + selectedUf (useState)
    ├── page/geography.page.tsx (+ css)             # 2 painéis (estados | municípios)
    └── components/
        ├── territory-list.component.tsx (+ css)    # lista genérica: item + Checkbox(isPartner) [reusada]
        └── territory-list.component → estados e municípios
src/routes/_authenticated/parceiros/territorios/index.tsx
src/modules/shell/.../shell-menu.config.ts          # + subitem "Geografia" (geography:read)
src/shared/i18n/catalog.pt-BR.ts                    # + partners.geography.*
tests/modules/partners/client/geography/geography.view-model.test.ts (+ .spec.tsx do toggle)
```
**Structure Decision**: vertical `geography` com UI própria. `territory-list` é um componente burro genérico
(recebe itens `{key,label,isPartner}` + `onToggle` + `disabled` por props) reusado para estados e municípios.
A atualização otimista é derivada pura na view-model (`applyToggle`) e aplicada via `setQueryData` no binding.

## Estimativa de Pipeline (W0 size)
- **Tamanho**: **M** (UI nova, mas 2 listas simples + toggle otimista; sem form/detalhe).
- **Plano de testes W0 (RED)**: (1) `geography.repository` map→Result (4 fns); (2) `geography.view-model`
  puro: ordenação, `applyToggle` (otimista numa lista), contagem de parceiros; (3) DOM: `territory-list`
  renderiza itens, dispara `onToggle`, respeita `disabled`; (4) regressão de menu (subitem Geografia por geography:read).
