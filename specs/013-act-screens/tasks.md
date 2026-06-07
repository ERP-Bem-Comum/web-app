# Tasks: Telas de ACTs (partners)

**Feature**: `013-act-screens` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Tamanho**: M. **TDD** por camada. Molde: `partners/client/financier-*`. Rota PT = `/parceiros/atos`.
**Nuances ACT**: PF (CPF 11 díg.), 2 selects enum (área/vínculo), 1 data (início), status duplo
(registration somente-leitura + activation alternável). RBAC: `collaborator:read`/`collaborator:write`.

## Phase 1: Setup
- [x] T001 Criar árvore `src/modules/partners/client/act-{list,create,detail,edit}/...` + `tests/modules/partners/client/act-*`.
- [x] T002 [P] i18n `partners.acts.*` em `catalog.pt-BR.ts` (list/columns/filters, form/fields, área PARC/DDI/DCE/EPV, vínculo CLT/PJ, registration pre/complete, status, detail/actions, confirm) — espelhando `partners.financiers.*`.

## Phase 2: Foundational
- [x] T003 [P] `domain/act.schemas.ts` (`ActListFiltersSchema`) + `act.types.ts` (`ActRow`, `StatusAction`).
- [x] T004 [P] `tests/.../domain/act.schemas.test.ts` (RED): defaults dos filtros; `ActFormSchema` CPF com/sem máscara, enums válidos, data, obrigatórios.
- [x] T005 [P] `data/model/act.model.ts`: tipos locais (`ActListItem/Detail/ListInput/WriteInput`, enums) + `ActFormSchema` (CPF normaliza 11 díg., occupationArea/employmentRelationship enums, startOfContract data).
- [x] T006 `data/repository/act.repository.ts` + `.instance.ts` (6 fns, reusa `partners-error.ts`). (dep T005)
- [x] T007 [P] `tests/.../data/repository/act.repository.test.ts` (RED): map `{ok,data|error}`→Result.
- [x] T008 Implementar `act.repository.ts` até T007 GREEN. (dep T007)
- [x] T009 Confirmar `can.ts` cobre `collaborator:read|write` (já existe) e `partners-error-tag` cobre `partners.error.*`. (dep T002)

## Phase 3: US1 Listar (P1) 🎯 MVP
- [x] T010 [P] [US1] `tests/.../act-list/act-list.view-model.test.ts` (RED): map item→row (2 status); DataTableState; reset página.
- [x] T011 [P] [US1] `act-list/act-list.query.ts` (sobre `repository.list`).
- [x] T012 [US1] `act-list/act-list.view-model.ts` (map→row, estado). (dep T011)
- [x] T013 [US1] `act-list/act-list.binding.ts` (`useQuery`→state; filtros; `canCreate` = collaborator:write). (dep T012)
- [x] T014 [P] [US1] `act-list/components/` filtros (busca+status) + controller + paginador.
- [x] T015 [US1] `act-list/page/act-list.page.tsx` (PageHeader + DataTable; colunas nome/email/área/cargo + 2 badges) + css. (dep T013,T014)
- [x] T016 [US1] Rota `routes/_authenticated/parceiros/atos/index.tsx` (`validateSearch`) + regenerar routeTree. (dep T015)
- [x] T017 [US1] Suites US1 GREEN + lint. (dep T016)

## Phase 4: US2 Criar (P1)
- [x] T018 [P] [US2] `tests/.../act-create/act-form.controller.spec.tsx` (Vitest, RED): bloqueia inválido; normaliza CPF; enums/data.
- [x] T019 [P] [US2] `act-create/components/act-form.controller.ts` (estado 7 campos + Zod). (até T018 GREEN)
- [x] T020 [P] [US2] `act-create/components/act-form.component.tsx` (7 campos: 2 selects enum + date input + texto) + css.
- [x] T021 [US2] `act-create/act-create.mutation.ts` + `.view-model.ts` + `.binding.ts` (navega→lista). (dep T006)
- [x] T022 [US2] `act-create/page/act-create.page.tsx` + css. (dep T019,T020,T021)
- [x] T023 [US2] Rota `atos/criar.tsx` + routeTree. (dep T022)
- [x] T024 [US2] Suites US2 GREEN + lint. (dep T023)

## Phase 5: US3 Detalhe + ativação (P2)
- [x] T025 [P] [US3] `tests/.../act-detail/act-detail.view-model.test.ts` (RED): estado ready/error; ação por activation; gate.
- [x] T026 [P] [US3] `act-detail/act-detail.query.ts` + `act-status.mutation.ts` (deactivate/reactivate).
- [x] T027 [US3] `act-detail/act-detail.view-model.ts` (estado + `statusActionFor(activation)`). (dep T026)
- [x] T028 [US3] `act-detail/act-detail.binding.ts` (`useQuery`+`useMutation`; canWrite=collaborator:write). (dep T027)
- [x] T029 [P] [US3] `act-detail/components/` detail-content (7 campos + 2 status) + confirm-dialog (espelhado). + css.
- [x] T030 [US3] `act-detail/page/act-detail.page.tsx` (gated; botão Editar) + css. (dep T028,T029)
- [x] T031 [US3] Rota `atos/$id.tsx` + routeTree. (dep T030)
- [x] T032 [US3] Suites US3 GREEN + lint. (dep T031)

## Phase 6: US4 Editar (P2)
- [x] T033 [US4] `act-edit/act-edit.query.ts` (via `getActFn`) + `.mutation.ts` (`updateActFn`+id) + `.view-model.ts` (detail→form) + `.binding.ts` (navega→detalhe). (dep T006,T021)
- [x] T034 [US4] `act-edit/components/act-edit-form.component.tsx` (reusa act-form) + `act-edit/page/act-edit.page.tsx` + css. (dep T033,T020)
- [x] T035 [US4] Rota `atos/$id.editar.tsx` + routeTree. (dep T034)
- [x] T036 [US4] Suites/typecheck/lint US4. (dep T035)

## Phase 7: Polish
- [x] T037 [P] Menu: subitem "ACTs" sob "Gestão de Parceiros" em `shell-menu.config.ts` → `/parceiros/atos`, `requiredPermission: 'collaborator:read'`.
- [x] T038 Estender regressão de menu em `root.view-model.test.ts`: com `collaborator:read` o subitem "ACTs" aparece; sem ele, não; seção sobrevive com qualquer um dos 3 reads. (dep T037; não [P])
- [x] T039 [P] Revisar i18n: sem literais; todas as tags `partners.acts.*` existem.
- [x] T040 Validar quickstart (views burras, agnóstico, erros→tag, só-tokens, RBAC, 2 status, enums/data/CPF).
- [x] T041 Gate final: `pnpm verify` + `pnpm test:dom` verdes; boundaries.
- [ ] T042 (Opcional) Baseline visual da listagem de ACTs.

## Dependencies
Setup → Foundational → US1→US2→US3→US4 → Polish. Rotas (T016/T023/T031/T035) sequenciais (routeTree).
## MVP
US1 (listar). Incrementos: US2/US3/US4.
