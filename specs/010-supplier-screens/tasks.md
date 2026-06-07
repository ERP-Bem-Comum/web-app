---

description: "Task list — Telas de Fornecedores (Suppliers)"
---

# Tasks: Telas de Fornecedores (Suppliers)

**Input**: Design documents from `specs/010-supplier-screens/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: INCLUÍDOS (TDD — mandato do projeto). Lógica pura (`*.test.ts`, node:test) e DOM (`*.spec.tsx`, Vitest) escritos antes da implementação correspondente (RED → GREEN).

**Escopo**: só **Fornecedores** (4 telas). Financiadores/geografia/ACTs fora. Backend pronto.

**Organization**: por user story. MVP = US1 (listar). Espelha `contracts/client`.

## Format: `[ID] [P?] [Story] Description`

- **[P]** = paralelizável (arquivos diferentes, sem dependência pendente). Caminhos relativos à raiz do `web-app`.

---

## Phase 1: Setup (estrutura + i18n)

- [x] T001 Criar a árvore de pastas em `src/modules/partners/client/` (`data/model`, `data/repository`, `data/helpers`, `domain`, `supplier-list/{page,components}`, `supplier-create/{page,components}`, `supplier-edit/page`, `supplier-detail/{page,components}`) e o espelho `tests/modules/partners/client/`
- [x] T002 [P] Adicionar o namespace `partners.suppliers.*` em `src/shared/i18n/catalog.pt-BR.ts` (list/columns/filters, form/sections/fields, detail/actions, error/*, common) — espelhando o namespace `contracts.*`

---

## Phase 2: Foundational (data + domain — bloqueia todas as US)

**⚠️ CRITICAL**: as US dependem da camada de dados e dos schemas.

- [x] T003 [P] Criar `src/modules/partners/client/domain/supplier.schemas.ts` (Zod do client): `SupplierListFiltersSchema` (search/active/categories/order/page/limit) e `SupplierFormSchema` (básicos + bancário/PIX "tudo ou nada", CNPJ com-e-sem-máscara) + `supplier.types.ts` (tipos inferidos + `SupplierRow`, `StatusAction`)
- [x] T004 [P] Escrever `tests/modules/partners/client/domain/supplier.schemas.test.ts` (RED): valida e-mail, CNPJ com/sem máscara, grupo bancário "tudo ou nada", obrigatórios, defaults dos filtros
- [x] T005 [P] Criar `src/modules/partners/client/data/model/supplier.model.ts`: Zod de parse defensivo do response (list/detail) + reexport dos tipos do `public-api` (`SupplierListItem`/`SupplierDetail`/`SupplierListResponse`)
- [x] T006 Criar `src/modules/partners/client/data/repository/supplier.repository.ts` (interface `SupplierRepository` devolvendo `Result`) + `supplier.repository.instance.ts` (wire das 7 server fns: list/get/create/update/deactivate/reactivate/categories → `Result`). (depende de T003, T005)
- [x] T007 [P] Escrever `tests/.../data/helpers/supplier-error-tag.test.ts` (RED) cobrindo cada `AppError.kind` + códigos de domínio (cnpj-duplicado, not-found, validation) → tag `partners.suppliers.error.*`
- [x] T008 Criar `src/modules/partners/client/data/helpers/supplier-error-tag.ts` (switch exaustivo `const _: never`) até o T007 ficar GREEN. (depende de T007)
- [x] T009 Confirmar que `data/helpers/can.ts` cobre `supplier:read|write|edit-sensitive` (já existe) e como as `permissions` do usuário chegam no contexto da rota `_authenticated` (R10) — ajustar a exposição se necessário (espelhar como o shell recebe `user`)

**Checkpoint**: data + domain prontos e testados; lint verde.

---

## Phase 3: User Story 1 - Listar fornecedores (P1) 🎯 MVP

**Goal**: tela de listagem com busca/filtros/status/categorias/ordenação/paginação, consumindo `DataTable` + `PageHeader`.

**Independent Test**: `/parceiros/fornecedores` lista dados reais; busca/filtros refletem na URL e no resultado; estados loading/empty/sem-resultado/erro corretos.

### Tests (TDD)

- [x] T010 [P] [US1] Escrever `tests/.../supplier-list/supplier-list.view-model.test.ts` (RED): map `SupplierListItem`→`SupplierRow`; derivação de `DataTableState` (loading/error/ready/empty); reset de página ao mudar filtro

### Implementação

- [x] T011 [P] [US1] `supplier-list/supplier-list.query.ts` — queryKey + queryOptions (puro) sobre `repository.list`; e `service-categories.query.ts` (categorias)
- [x] T012 [US1] `supplier-list/supplier-list.view-model.ts` — derivações puras (model→row, estado, contagens); até T010 GREEN. (depende de T011)
- [x] T013 [US1] `supplier-list/supplier-list.binding.ts` — `useQuery` → `DataTableState`; lê filtros dos search params; expõe callbacks (search/status/categoria/order/page) e `canCreate`. (depende de T012)
- [x] T014 [P] [US1] Componentes locais da listagem em `supplier-list/components/`: barra de filtros (busca/status/categorias/ordenação) + paginador + ações de linha — views burras, só-tokens, i18n
- [x] T015 [US1] `supplier-list/page/supplier-list.page.tsx` — view burra: `PageHeader` (ação "Novo fornecedor" gated) + filtros + `DataTable<SupplierRow>` (colunas i18n, status via `Badge`) + paginador. (depende de T013, T014)
- [x] T016 [US1] Rota `src/routes/_authenticated/parceiros/fornecedores/index.tsx` (`createFileRoute`, `validateSearch = SupplierListFiltersSchema`, component = page) e regenerar o routeTree. (depende de T015)
- [x] T017 [US1] `pnpm test:dom`/`pnpm test` das suites de US1 GREEN + `pnpm lint` verde para os arquivos novos. (depende de T016)

**Checkpoint**: listagem funcional e navegável. ✅ MVP.

---

## Phase 4: User Story 2 - Criar fornecedor (P1)

**Goal**: formulário de criação (básicos + bancário/PIX opcionais), validação na borda, RBAC.

**Independent Test**: `/parceiros/fornecedores/criar` cria com dados válidos; bloqueia inválidos; erro de backend (cnpj duplicado) exibido.

### Tests (TDD)

- [ ] T018 [P] [US2] Escrever `tests/.../supplier-create/supplier-form.controller.spec.tsx` (Vitest, RED): bloqueia submit inválido (sem chamar backend); emite input válido; respeita `canEditSensitive` (oculta bancário/PIX)

### Implementação

- [ ] T019 [P] [US2] `supplier-create/components/supplier-form.controller.ts` — estado do form + validação Zod (`SupplierFormSchema`), normaliza CNPJ, grupo bancário "tudo ou nada"; até T018 GREEN
- [ ] T020 [P] [US2] `supplier-create/components/supplier-form.component.tsx` — view burra: seções básicos/bancário/PIX (gate sensível), usando atoms/molecules do DS (`Field`/`Input`/`Button`), só-tokens, i18n
- [ ] T021 [US2] `supplier-create/supplier-create.mutation.ts` + `.view-model.ts` (onSuccess: invalida lista) + `.binding.ts` (`useMutation` → Command `{running,errorTag,execute}`). (depende de T006)
- [ ] T022 [US2] `supplier-create/page/supplier-create.page.tsx` — `PageHeader` + `supplier-form` ligado ao Command; navega à lista/detalhe no sucesso. (depende de T019, T020, T021)
- [ ] T023 [US2] Rota `src/routes/_authenticated/parceiros/fornecedores/criar.tsx` + regenerar routeTree. (depende de T022)
- [ ] T024 [US2] Suites de US2 GREEN + `pnpm lint` verde. (depende de T023)

**Checkpoint**: criar + listar = ciclo mínimo (ver + adicionar).

---

## Phase 5: User Story 3 - Detalhar + mudar status (P1)

**Goal**: detalhe completo (com gate sensível) + inativar/reativar com confirmação.

**Independent Test**: navegar da lista ao detalhe; ver dados; inativar/reativar com confirmação reflete o status; id inexistente → "não encontrado".

### Tests (TDD)

- [ ] T025 [P] [US3] Escrever `tests/.../supplier-detail/supplier-detail.view-model.test.ts` (RED): estado ready/not-found/error; decisão da ação (`deactivate` se ativo, `reactivate` se inativo); gates por permissão

### Implementação

- [ ] T026 [P] [US3] `supplier-detail/supplier-detail.query.ts` (sobre `repository.getById`) + `supplier-status.mutation.ts` (deactivate/reactivate, invalida detalhe+lista)
- [ ] T027 [US3] `supplier-detail/supplier-detail.view-model.ts` — derivação de estado + ação de status + gates; até T025 GREEN. (depende de T026)
- [ ] T028 [US3] `supplier-detail/supplier-detail.binding.ts` — `useQuery` + `useMutation` → estado + `statusCommand`. (depende de T027)
- [ ] T029 [P] [US3] Componentes locais do detalhe em `supplier-detail/components/`: hero + aside (bancário/PIX gated) + confirmação de status (componente local, só-tokens, R9)
- [ ] T030 [US3] `supplier-detail/page/supplier-detail.page.tsx` — view burra liga estado + ações (gated por `canWrite`); botão "Editar". (depende de T028, T029)
- [ ] T031 [US3] Rota `src/routes/_authenticated/parceiros/fornecedores/$id.tsx` + regenerar routeTree. (depende de T030)
- [ ] T032 [US3] Suites de US3 GREEN + `pnpm lint` verde. (depende de T031)

**Checkpoint**: ver → detalhe → ação de status completo.

---

## Phase 6: User Story 4 - Editar fornecedor (P2)

**Goal**: edição reusando o `supplier-form`, pré-preenchida.

**Independent Test**: `/parceiros/fornecedores/$id/editar` vem preenchido; salva alteração válida; bloqueia inválida; gate de escrita.

### Implementação (reusa form/controller de US2)

- [ ] T033 [US4] `supplier-edit/supplier-edit.query.ts` (pré-preenche via `getSupplierFn`) + `supplier-edit.mutation.ts` (`updateSupplierFn`, com `id`) + `.view-model.ts` + `.binding.ts`. (depende de T006, T021)
- [ ] T034 [US4] `supplier-edit/page/supplier-edit.page.tsx` — reusa `supplier-form.component` com `initialValues`; liga ao Command de update. (depende de T033, T020)
- [ ] T035 [US4] Rota `src/routes/_authenticated/parceiros/fornecedores/$id.editar.tsx` + regenerar routeTree. (depende de T034)
- [ ] T036 [US4] Suites/typecheck/lint de US4 verdes. (depende de T035)

**Checkpoint**: CRUD de fornecedor completo.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T037 [P] Ligar o menu: subitem "Fornecedores" sob "Gestão de Parceiros" em `shell-menu.config` apontando para `/parceiros/fornecedores` (sem `requiredPermission` ainda — isso é o item 2/RBAC do menu, feature separada)
- [ ] T038 [P] Revisar i18n: nenhuma string literal nas views; todas as tags `partners.suppliers.*` existem no catálogo
- [ ] T039 Validar o `quickstart.md` (checklist de conformidade por tela: views burras, núcleo agnóstico, erros→tag, só-tokens, RBAC, organismos)
- [ ] T040 Gate final: `pnpm verify` (typecheck + lint + test) e `pnpm test:dom` verdes; conferir boundaries (client não importa `server/domain|application`; views sem data-hooks)
- [ ] T041 (Opcional) Baseline visual da listagem de fornecedores em `e2e/visual/` (rota real autenticada), seguindo a receita validada do guia — gerar `-linux` com revisão humana

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2, bloqueia tudo)** → **US1 → US2 → US3 → US4** → **Polish**.
- US1/US2/US3 são todas P1 e majoritariamente independentes após a Foundational; US4 (P2) depende do form de US2 (T020) e do repository.
- Rotas (T016/T023/T031/T035) cada uma regenera o routeTree — sequenciar para evitar corrida no `routeTree.gen.ts`.
- `supplier-form` (T019/T020) é compartilhado por US2 e US4 — fazer em US2.

## Parallel Opportunities

- Setup: T001/T002.
- Foundational: T003/T004/T005 e T007 em paralelo; T006 depende de T003+T005; T008 depende de T007.
- Dentro de cada US: o teste (RED) + componentes locais [P] em paralelo; view-model→binding→page sequenciais.

## Implementation Strategy

1. **MVP** = Setup + Foundational + US1 (listar) → validar → demo.
2. Incremental: + US2 (criar) → + US3 (detalhe/status) → + US4 (editar) → Polish (menu + gate).
3. Cada US fecha com suites verdes + lint antes de avançar.

## Notes

- Espelhar `contracts/client` em cada arquivo (mesma anatomia). Camada = sufixo do arquivo (§XI).
- Erros sempre via `supplier-error-tag` (switch exaustivo). Strings via `partners.suppliers.*`. CSS só-tokens.
- Listagem usa `DataTable` + `PageHeader` (não recriar). RBAC via `can()`.
- Commits: `feat(partners/...): …`. PR → `develop`. Nunca heredoc.
- **Total: 41 tasks** (Setup 2 · Foundational 7 · US1 8 · US2 7 · US3 8 · US4 4 · Polish 5).
