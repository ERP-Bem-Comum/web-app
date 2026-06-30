# Tasks: Inclusão de Colaborador (Novo Colaborador)

**Feature**: 018-collaborator-create · **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)
**Escopo**: frontend-only, módulo `partners`, espelhar `supplier-create`. Backend/BFF/client-data já prontos.

## Phase 1: Setup
Nenhum (slice novo dentro de módulo existente; sem deps novas).

## Phase 2: Foundational (bloqueia as user stories)

- [x] T001 [P] Adicionar tags i18n `partners.collaborators.create.*` em `src/shared/i18n/catalog.pt-BR.ts` (título, subtítulo, labels: name/email/cpf/occupationArea/role/startOfContract/employmentRelationship, placeholders dos selects, botões salvar/cancelar). Enums já têm i18n (`partners.collaborators.area.*`, `...employment.*`).
- [x] T002 [P] Criar `src/modules/partners/client/collaborator-create/collaborator-create.mutation.ts` — `collaboratorCreateMutationKey = ['collaborators','create']` + `mutationFn: (input) => collaboratorRepository.create(input)` (espelha `supplier-create.mutation.ts`).
- [x] T003 Criar `src/modules/partners/client/collaborator-create/collaborator-create.view-model.ts` — `{ mutation: collaboratorCreateMutationOptions, toErrorTag: partnersErrorTag, unexpectedErrorTag: 'partners.error.server' }` (depende de T002).

## Phase 3: User Story 1 — Cadastrar um novo colaborador (P1) 🎯 MVP

**Goal**: operador autorizado cria um colaborador via formulário e ele aparece na listagem.
**Independent test**: criar colaborador válido em `/parceiros/colaboradores/criar` → volta à lista com o registro.

- [x] T004 [US1] Criar `collaborator-create/collaborator-create.binding.ts` — `useMutation`→Command (`running`/`errorTag`/`execute`); `onSuccess`: `invalidateQueries(['collaborators'])` + `navigate('/parceiros/colaboradores')`; expor `canWrite = can(granted,'collaborator:write')`. Espelha `supplier-create.binding.ts`.
- [x] T005 [P] [US1] TEST (node:test) `tests/modules/partners/client/collaborator-create/collaborator-create.view-model.test.ts` — cada `PartnersError` → tag correta (imports relativos).
- [x] T006 [US1] Criar `collaborator-create/components/collaborator-form.controller.ts` — estado dos 7 campos + `canSubmit` (todos válidos: name 1–200, email formato, cpf ≥11 dígitos, área/vínculo escolhidos, role 1–120, startOfContract preenchida) + `submit()` montando o `CreateCollaboratorInput`.
- [x] T007 [P] [US1] TEST (node:test) `tests/modules/partners/client/collaborator-create/collaborator-form.controller.test.ts` — `canSubmit` (todos válidos→true; faltando campo / email inválido / cpf curto → false) + `submit()` monta o input correto.
- [x] T008 [US1] Criar `collaborator-create/components/collaborator-form.component.tsx` (view burra, só-tokens `vars.*`): inputs texto/email/date + 2 `<select>` (área PARC/DDI/DCE/EPV, vínculo CLT/PJ com tags i18n); props `onSubmit`/`submitting`/`errorTag`; sem `useQuery`/`useMutation`/`useReducer`.
- [x] T009 [US1] Criar `collaborator-create/components/collaborator-form.css.ts` (só-tokens, espelha `supplier-form.css.ts`).
- [x] T010 [P] [US1] TEST (vitest/jsdom) `tests/modules/partners/client/collaborator-create/collaborator-form.spec.tsx` — renderiza os 7 campos; selects com as opções dos enums; dispara `onSubmit` com o input; exibe `errorTag`.
- [x] T011 [US1] Criar `collaborator-create/page/collaborator-create.page.tsx` (PageHeader + `CollaboratorForm` + `useCollaboratorCreateBinding`; cancelar → volta à lista) + `page/collaborator-create.css.ts`.
- [x] T012 [US1] Criar rota `src/routes/_authenticated/parceiros/colaboradores/criar.tsx` (`createFileRoute` → `CollaboratorCreatePage`, espelha `fornecedores/criar.tsx`).

**Checkpoint US1**: criar colaborador funciona via URL direta `/parceiros/colaboradores/criar`.

## Phase 4: User Story 2 — Botão "Novo" com RBAC (P2)

**Goal**: botão Novo na listagem, só com `collaborator:write`.
**Independent test**: com permissão → botão aparece e navega; sem → não aparece.

- [x] T013 [US2] Editar `collaborator-list/page/collaborator-list.page.tsx` — destruturar `canCreate` do binding + renderizar botão "Novo" no `PageHeader actions` (gated por `canCreate`) → `navigate('/parceiros/colaboradores/criar')`. Espelha `supplier-list.page.tsx`.
- [x] T014 [P] [US2] (opcional) TEST (vitest) — botão "Novo" aparece só quando `canCreate` é true.

## Phase 5: Polish & validação

- [x] T015 Rodar `pnpm verify` (typecheck + lint + node) + `pnpm test:dom`; corrigir o que surgir. Sem regressão na lista nem nos outros submódulos.
- [x] T016 Revisar boundaries/lint (public-api, só-tokens, i18n, views burras) e naming por postfix.
- [x] T017 Validar em tela (stack de pé): `/parceiros/colaboradores` (botão Novo por permissão) e `/parceiros/colaboradores/criar` (happy path → volta à lista; sad path → erro sem sair da tela).

## Dependencies
- Phase 2 (T001–T003) bloqueia Phase 3.
- T003 depende de T002. T004 depende de T003. T006→T008→T011→T012 (cadeia). US2 (T013) depende do slice/rota da US1 existirem (navegação).
- Testes [P] (T005/T007/T010/T014) paralelos aos respectivos arquivos de implementação.

## Parallel example
- T001, T002 em paralelo (arquivos distintos).
- Após T011/T012: T005, T007, T010 podem rodar em paralelo.

## MVP
US1 (Phase 2 + Phase 3) já entrega valor: criação de colaborador funcional (mesmo antes do botão Novo, via rota). US2 adiciona o acesso pela UI.
