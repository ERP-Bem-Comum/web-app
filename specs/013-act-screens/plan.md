# Implementation Plan: Telas de ACTs (partners)

**Branch**: `develop` (feature dir `013-act-screens`) | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

## Summary
Entregar o `client/` das telas de **ACT** espelhando o molde validado de financiadores (012). Server-side
pronto (6 fns + `act.io.ts`, já exportados no public-api). Nuances vs financier: **PF** (CPF), 7 campos com
**2 selects enum** (occupationArea PARC/DDI/DCE/EPV, employmentRelationship CLT/PJ), **1 campo data**
(startOfContract), e **status duplo** (registration `pre-registration|complete` somente-leitura + activation
`active|inactive` alternável). RBAC de UI por **`collaborator:read`/`collaborator:write`**.

## Technical Context
- **Language**: TS strict · **Deps**: React 19, TanStack Start/Router/Query, vanilla-extract, Zod 4 (nenhuma nova)
- **Testing**: node:test (puros) + Vitest/jsdom (DOM)
- **Project Type**: web app, módulo `partners`, camada `client` (MVVM §XI)
- **Constraints**: views burras, view-models sem React, só-tokens, boundaries, i18n tags

## Constitution Check — PASS
- §I boundaries (client/data → server/adapters; sem server/domain/public-api; rotas importam pages direto)
- §III server fn única fronteira · §IV `activation`/`registration` = uniões; status state discriminado
- §V PartnersError → tag · §IX RBAC `collaborator:*` + menu · §X só-tokens · §XI views burras
- Sem violações → sem Complexity Tracking.

## Project Structure (espelho do financier, prefixo `act-`)
```
src/modules/partners/client/
├── domain/ act.types.ts · act.schemas.ts            # FinancierListFilters → ActListFilters; form 7 campos
├── data/model/ act.model.ts                          # tipos locais + ActFormSchema (CPF, enums, data)
├── data/repository/ act.repository.ts · .instance.ts # 6 fns; reusa partners-error.ts
├── act-list/   query · view-model · binding · page(+css) · components(filters+controller+css, paginator+css)
├── act-create/ controller · form.component(+css) · mutation · view-model · binding · page(+css)
├── act-detail/ query · status.mutation · view-model · binding · page(+css) · components(confirm-dialog, detail-content)
└── act-edit/   query(reusa detail) · mutation · view-model · binding · edit-form.component · page(+css)
src/routes/_authenticated/parceiros/atos/  index · criar · $id · $id.editar    # slug de rota: "atos"
src/modules/shell/.../shell-menu.config.ts  # + subitem "ACTs" (collaborator:read)
src/shared/i18n/catalog.pt-BR.ts            # + partners.acts.* (inclui enums area/vinculo + 2 status)
tests/modules/partners/client/act-*         # espelha as suites do financier
```
**Structure Decision**: replica `financier-*` → `act-*`. Rota em PT = `/parceiros/atos`. Diferenças:
2 selects enum + 1 date input no form; 2 badges (registration+activation) na lista/detalhe; CPF (11 dígitos).

## Estimativa de Pipeline (W0 size)
- **Tamanho**: **M** (replicação de molde + nuances de form: enums/data/CPF + status duplo).
- **Plano de testes W0 (RED)**: (1) `act.repository` map → Result; (2) `act-list.view-model` map→row (2 status);
  (3) `act-form.controller` (DOM) bloqueia inválido / normaliza CPF / enums; (4) `act-detail.view-model`
  estado + ação de ativação; (5) regressão de menu (subitem ACTs por collaborator:read).
