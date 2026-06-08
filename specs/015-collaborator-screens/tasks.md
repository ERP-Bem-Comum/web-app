---
description: "Task list — Telas de Colaboradores (015)"
---

# Tasks: Telas de Colaboradores (partners)

**Input**: `specs/015-collaborator-screens/` (plan.md, spec.md, research.md, data-model.md, contracts/)

**Tests**: incluídos (TDD pedido). `*.test.ts` = node:test (puros); `*.spec.tsx` = Vitest/jsdom; `*.e2e.ts` = Playwright.

**Frontend-only**: reusa as 8 server-fns existentes. **NÃO** criar server-fn nem tocar `core-api`.

**Referência de espelhamento**: `src/modules/partners/client/act-*` (+ `supplier-*`).

## Format: `[ID] [P?] [Story] Descrição com caminho`

---

## Phase 1: Setup

- [X] T001 Conferir referências e contrato: ler `act-*` (list/create/edit/detail) e os 8 server-fns em `src/modules/partners/server/adapters/server-fns/collaborator/` + `collaborator.io.ts` (campos/enums) antes de codar.

## Phase 2: Foundational (bloqueia todas as stories)

- [X] T002 [P] Criar `src/modules/partners/client/data/model/collaborator.model.ts` (model Zod do Colaborador: 7 campos essenciais + campos do cadastro completo + `registrationStatus` + ativo/inativo), espelhando `data/model/act.model.ts`.
- [X] T003 Criar `src/modules/partners/client/data/repository/collaborator.repository.ts` (porta → server-fns list/get/create/complete/update/deactivate/reactivate/import; retorna `Result`), espelhando `act.repository.ts`.
- [X] T004 Criar `src/modules/partners/client/data/repository/collaborator.repository.instance.ts`, espelhando `act.repository.instance.ts`.
- [X] T005 [P] Adicionar namespace i18n base `partners.collaborator.*` (rótulos de enums: occupationArea PARC/DDI/DCE/EPV, employmentRelationship CLT/PJ, registrationStatus Pré Cadastrado/Cadastrado, motivos de desativação) em `src/shared/i18n/catalog.pt-BR.ts`.
- [ ] T006 [P] Teste do model/derivações puras: `tests/modules/partners/client/data/collaborator.model.test.ts` (parse/refine; mapeamento de situação cadastral).

## Phase 3: US1 — Visualizar e buscar (P1) 🎯 MVP

**Goal**: lista em `/parceiros/colaboradores` com busca e filtro de idade; item no menu.
**Independent test**: acessar a lista, buscar por nome/e-mail, aplicar filtro de idade.

- [X] T007 [P] [US1] `collaborator-list/collaborator-list.query.ts` (TanStack Query key + queryFn → repository.list), espelhando `act-list/act-list.query.ts`.
- [X] T008 [US1] `collaborator-list/collaborator-list.view-model.ts` com derivação PURA do **filtro de idade** a partir de `dateOfBirth` (regra D2: sem `dateOfBirth` → fora quando filtro ativo) e mapeamento de situação cadastral, espelhando `act-list.view-model.ts`.
- [ ] T009 [P] [US1] Teste puro: `tests/modules/partners/client/collaborator-list/collaborator-list.view-model.test.ts` (filtro de idade, busca, situação cadastral).
- [X] T010 [US1] `collaborator-list/collaborator-list.binding.ts` (liga query + VM), espelhando `act-list.binding.ts`.
- [X] T011 [P] [US1] `collaborator-list/components/collaborator-filters.component.tsx` + `.controller.ts` + `.css.ts`, espelhando `act-filters.*` (busca + filtro de idade + status; só-tokens).
- [X] T012 [P] [US1] `collaborator-list/components/collaborator-paginator.component.tsx` + `.css.ts`, espelhando `act-paginator.*`.
- [X] T013 [US1] `collaborator-list/page/collaborator-list.page.tsx` + `.css.ts` (view burra; recebe tudo da VM por props), espelhando `act-list/page/*`.
- [ ] T014 [US1] Exportar bindings/VM da lista em `src/modules/partners/public-api/index.ts`.
- [X] T015 [US1] Rota `src/routes/_authenticated/parceiros/colaboradores/index.tsx`, espelhando `parceiros/atos/index.tsx`.
- [X] T016 [US1] Adicionar subitem `{ label: 'Colaboradores', to: '/parceiros/colaboradores', requiredPermission: 'collaborator:read' }` em `src/modules/shell/client/data/menu/shell-menu.config.ts` (na seção Gestão de Parceiros) + atualizar o teste `tests/modules/shell/client/root/root.view-model.test.ts` (ordem/labels dos subitens).
- [ ] T017 [P] [US1] Componente test: `tests/modules/partners/client/collaborator-list/collaborator-list.spec.tsx` (render lista + estado vazio + busca), espelhando o spec de act/supplier.

## Phase 4: US2 — Cadastro em duas etapas (P1)

**Goal**: criar pré-cadastro (7 campos → Pré Cadastrado) e completar no editar (→ Cadastrado).
**Independent test**: criar em `/adicionar`, completar em `/editar/:id`.

- [ ] T018 [P] [US2] `collaborator-create/collaborator-create.mutation.ts` (usa `createCollaboratorFn`), espelhando `act-create.mutation.ts`.
- [ ] T019 [US2] `collaborator-create/collaborator-create.view-model.ts` + `collaborator-create.binding.ts`, espelhando `act-create.*`.
- [ ] T020 [US2] `collaborator-create/components/collaborator-form.component.tsx` + `.controller.ts` + `.css.ts` (7 campos essenciais; validação client; RBAC `collaborator:write`), espelhando `act-form.*`.
- [ ] T021 [US2] `collaborator-create/page/collaborator-create.page.tsx` + `.css.ts`, espelhando `act-create/page/*`.
- [ ] T022 [US2] Rota `src/routes/_authenticated/parceiros/colaboradores/adicionar.tsx`, espelhando `parceiros/atos/criar.tsx`.
- [ ] T023 [P] [US2] `collaborator-edit/collaborator-edit.mutation.ts` (usa `updateCollaboratorFn` + `completeCollaboratorRegistrationFn` → promove a Cadastrado), espelhando `act-edit.mutation.ts`.
- [ ] T024 [US2] `collaborator-edit/collaborator-edit.view-model.ts` + `collaborator-edit.binding.ts`, espelhando `act-edit.*`.
- [ ] T025 [US2] `collaborator-edit/components/collaborator-edit-form.component.tsx` (+ css) com os dados pessoais do cadastro completo, espelhando `act-edit-form`.
- [ ] T026 [US2] `collaborator-edit/page/collaborator-edit.page.tsx` + `.css.ts`, espelhando `act-edit/page/*`.
- [ ] T027 [US2] Rota `src/routes/_authenticated/parceiros/colaboradores/editar.$id.tsx`, espelhando `parceiros/atos/$id.editar.tsx`.
- [ ] T028 [US2] Exportar create/edit em `public-api/index.ts`.
- [ ] T029 [P] [US2] Tests: controller do form (validação dos 7 campos) `*.test.ts` + componente `*.spec.tsx`.

## Phase 5: US3 — Desativar com Motivo / Reativar (P2)

**Goal**: detalhe + modal de desativar com Motivo obrigatório; reativar inativo.
**Independent test**: abrir detalhe, desativar (botão travado sem motivo), reativar.

- [ ] T030 [P] [US3] `collaborator-detail/collaborator-detail.query.ts`, espelhando `act-detail.query.ts`.
- [ ] T031 [US3] `collaborator-detail/collaborator-detail.view-model.ts` + `collaborator-detail.binding.ts`, espelhando `act-detail.*`.
- [ ] T032 [US3] `collaborator-detail/collaborator-status.mutation.ts` (usa `deactivateCollaboratorFn` + `reactivateCollaboratorFn`), espelhando `act-status.mutation.ts`.
- [ ] T033 [US3] `collaborator-detail/components/deactivate-dialog.component.tsx` + `.css.ts` (select de Motivo do enum; botão desabilitado sem motivo), espelhando `confirm-dialog.*`.
- [ ] T034 [US3] `collaborator-detail/components/collaborator-detail-content.component.tsx` + `.css.ts`, espelhando `act-detail-content.*`.
- [ ] T035 [US3] `collaborator-detail/page/collaborator-detail.page.tsx` + `.css.ts` + rota `parceiros/colaboradores/$id.tsx`, espelhando `act-detail`.
- [ ] T036 [US3] Exportar detail em `public-api/index.ts`.
- [ ] T037 [P] [US3] Tests: VM puro (estado ativo/inativo) + componente do dialog (botão travado sem motivo).

## Phase 6: US4 — Importar CSV em lote (P3)

**Goal**: importar CSV (≤2 MiB) e exibir `{criados, falhas}`.
**Independent test**: enviar CSV válido e CSV com linhas inválidas; arquivo grande recusado.

- [ ] T038 [US4] `collaborator-list/components/import-collaborators-dialog.component.tsx` + `.controller.ts` + `.css.ts` (lê `File.text()`, valida `text/csv` + tamanho ≤2 MiB com Zod, chama `importCollaboratorsFn`, mostra `{criados, falhas}`).
- [ ] T039 [US4] Integrar o botão "Importar" na page da lista (US1) gated por `collaborator:write`.
- [ ] T040 [P] [US4] Tests: controller do import (validação de tipo/tamanho) `*.test.ts` + componente `*.spec.tsx`.

## Phase 7: Polish & Cross-Cutting

- [ ] T041 [P] RBAC: confirmar que todas as ações de escrita (criar/editar/desativar/reativar/importar) ficam ocultas/desabilitadas sem `collaborator:write` (revisar todos os componentes).
- [ ] T042 [P] i18n: varrer literais de UI restantes → `partners.collaborator.*` (lint só-tokens/i18n verde).
- [ ] T043 e2e: `e2e/partners/collaborator.happy.e2e.ts` + `collaborator.sad.e2e.ts` espelhando supplier/act (login → CRUD → desativar → import).
- [ ] T044 Rodar `pnpm verify` (typecheck + lint + test) e `pnpm test:dom`; corrigir o que aparecer.
- [ ] T045 Validar no navegador (stack docker): menu mostra Colaboradores; criar→completar→desativar→importar; smoke do quickstart.md.

---

## Dependencies / ordem

- **Setup (T001)** → **Foundational (T002–T006)** → stories.
- **US1 (T007–T017)** = MVP; entrega a lista navegável. Depende de Foundational.
- **US2 (T018–T029)**, **US3 (T030–T037)**, **US4 (T038–T040)** dependem de Foundational; US3/US4 assumem a lista (US1) para navegação/integração.
- **Polish (T041–T045)** por último.

## Paralelização (exemplos)

- Foundational: T002, T005, T006 em paralelo (arquivos distintos).
- US1: T007, T011, T012, T017 em paralelo; depois T008→T009→T010→T013→T014→T015→T016.
- US2: T018 e T023 em paralelo (mutations distintas).

## MVP

**US1 (lista + menu)** já entrega valor visível: o submódulo Colaboradores aparece e lista. Incrementos US2→US3→US4 completam o CRUD + import.

## Validação de formato

Todas as tarefas seguem `- [ ] Txxx [P?] [US?] descrição + caminho`. ✓
