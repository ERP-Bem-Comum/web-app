# Tasks: Telas de Financiadores (partners)

**Feature**: `012-financier-screens` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Tamanho**: M (replicação do molde validado da 010 em ~30–35 arquivos; sem lógica nova de domínio).
**Abordagem TDD**: por camada, o teste (RED) antes da implementação (GREEN). Globs disjuntos:
`*.test.ts` → node:test (puro, imports relativos) · `*.spec.tsx` → Vitest/jsdom (DOM).

**Molde a espelhar**: `src/modules/partners/client/supplier-*` + `tests/modules/partners/client/supplier-*`.
**Diferenças financier**: PJ-only, 6 campos; **sem** categorias de serviço, **sem** pagamento/PIX,
**sem** coluna e-mail. Navegação: criar→listagem, editar→detalhe. RBAC: `financier:read`/`financier:write`
(`edit-sensitive` não se aplica).

---

## Phase 1: Setup (estrutura + i18n)

- [x] T001 Criar a árvore de pastas em `src/modules/partners/client/` (`domain`, `data/model`, `data/repository`, `financier-list/{page,components}`, `financier-create/{page,components}`, `financier-detail/{page,components}`, `financier-edit/page`) e o espelho em `tests/modules/partners/client/financier-*`. Reusar `data/helpers/` existente (`can`, `partners-error-tag`).
- [x] T002 [P] Adicionar o namespace `partners.financiers.*` em `src/shared/i18n/catalog.pt-BR.ts` (list/columns/filters, form/fields, detail/actions, error/*, common) — espelhando `partners.suppliers.*`, **sem** chaves de categorias/pagamento/e-mail.

---

## Phase 2: Foundational (data + domain — bloqueia todas as US)

- [x] T003 [P] Criar `src/modules/partners/client/domain/financier.schemas.ts` (Zod do client): `FinancierListFiltersSchema` (search/active/order/page/limit, defaults order=ASC/page=1/limit=5) e `FinancierFormSchema` (6 campos obrigatórios; CNPJ com-e-sem-máscara normalizando p/ 14 dígitos) + `financier.types.ts` (tipos inferidos + `FinancierRow`, `StatusAction`).
- [x] T004 [P] Escrever `tests/modules/partners/client/domain/financier.schemas.test.ts` (RED): CNPJ com/sem máscara, obrigatórios e limites dos 6 campos, defaults dos filtros.
- [x] T005 [P] Criar `src/modules/partners/client/data/model/financier.model.ts`: tipos locais `FinancierListInput`/`FinancierListResponse`/`FinancierDetail`/`FinancierWriteInput` (boundary §I — não importa server/domain nem public-api) + parse defensivo do response (list/detail).
- [x] T006 Criar `src/modules/partners/client/data/repository/financier.repository.ts` (interface `FinancierRepository` devolvendo `Result`, `PartnersError` local) + `financier.repository.instance.ts` (wire das **6** server-fns de `server/adapters`: list/get/create/update/deactivate/reactivate → `Result`; **sem** categorias). (depende de T005)
- [x] T007 [P] Escrever `tests/modules/partners/client/data/repository/financier.repository.test.ts` (RED): mapeia `{ok,data|error}` → `Result`/`PartnersError` (not-found/validation/forbidden/conflict), fns injetadas (fakes).
- [x] T008 Implementar `financier.repository.ts` até T007 ficar GREEN. (depende de T007)
- [x] T009 Confirmar que `data/helpers/can.ts` cobre `financier:read|write` (já existe no catálogo) e que `partners-error-tag` cobre as tags `partners.financiers.error.*` (adicionar mapeamento se faltar). (depende de T002)

---

## Phase 3: User Story 1 - Listar financiadores (P1) 🎯 MVP

**Goal**: tabela paginada com busca/filtro/ordenação; ação "Novo financiador" gated por `financier:write`.
**Independent Test**: abrir a listagem com `financier:read`, povoar a tabela, buscar, filtrar por status, paginar.

- [x] T010 [P] [US1] Escrever `tests/modules/partners/client/financier-list/financier-list.view-model.test.ts` (RED): map `FinancierListItem`→`FinancierRow`; derivação de `DataTableState` (loading/error/ready/empty); reset de página ao mudar filtro.
- [x] T011 [P] [US1] `financier-list/financier-list.query.ts` — queryKey + queryOptions (puro) sobre `repository.list`.
- [x] T012 [US1] `financier-list/financier-list.view-model.ts` — derivações puras (model→row, estado, contagens); até T010 GREEN. (depende de T011)
- [x] T013 [US1] `financier-list/financier-list.binding.ts` — `useQuery` → `DataTableState`; lê filtros dos search params; expõe callbacks (search/status/order/page) e `canCreate`. (depende de T012)
- [x] T014 [P] [US1] Componentes locais em `financier-list/components/`: barra de filtros (busca/status/ordenação) + controller + paginador — views burras, só-tokens, i18n.
- [x] T015 [US1] `financier-list/page/financier-list.page.tsx` — view burra: `PageHeader` (ação "Novo financiador" gated) + filtros + `DataTable<FinancierRow>` (colunas nome/razão social/CNPJ/telefone/status via `Badge`) + paginador. (depende de T013, T014)
- [x] T016 [US1] Rota `src/routes/_authenticated/parceiros/financiadores/index.tsx` (`createFileRoute`, `validateSearch = FinancierListFiltersSchema`, component = page) e regenerar o routeTree. (depende de T015)
- [x] T017 [US1] Suites de US1 (`pnpm test` + `pnpm test:dom`) GREEN + `pnpm lint` verde nos arquivos novos. (depende de T016)

---

## Phase 4: User Story 2 - Cadastrar financiador (P1)

**Goal**: formulário PJ-only de 6 campos; salvar cria e volta à listagem.
**Independent Test**: com `financier:write`, preencher 6 campos válidos, salvar, ver o registro na lista.

- [x] T018 [P] [US2] Escrever `tests/modules/partners/client/financier-create/financier-form.controller.spec.tsx` (Vitest, RED): bloqueia submit inválido (sem chamar backend); emite input válido; normaliza CNPJ.
- [x] T019 [P] [US2] `financier-create/components/financier-form.controller.ts` — estado do form + validação Zod (`FinancierFormSchema`), normaliza CNPJ; até T018 GREEN.
- [x] T020 [P] [US2] `financier-create/components/financier-form.component.tsx` — view burra: os 6 campos via atoms/molecules do DS (`Field`/`Input`/`Button`), só-tokens, i18n. **Sem** seções bancário/PIX.
- [x] T021 [US2] `financier-create/financier-create.mutation.ts` + `.view-model.ts` (onSuccess: invalida lista) + `.binding.ts` (`useMutation` → Command `{running,errorTag,execute}`, navega à **listagem** no sucesso). (depende de T006)
- [x] T022 [US2] `financier-create/page/financier-create.page.tsx` — `PageHeader` + `financier-form` ligado ao Command. (depende de T019, T020, T021)
- [x] T023 [US2] Rota `src/routes/_authenticated/parceiros/financiadores/criar.tsx` + regenerar routeTree. (depende de T022)
- [x] T024 [US2] Suites de US2 GREEN + `pnpm lint` verde. (depende de T023)

---

## Phase 5: User Story 3 - Detalhar + alternar status (P2)

**Goal**: detalhe com todos os campos; ativar/desativar gated por `financier:write`.
**Independent Test**: abrir detalhe, conferir campos, desativar/reativar e ver o status mudar.

- [x] T025 [P] [US3] Escrever `tests/modules/partners/client/financier-detail/financier-detail.view-model.test.ts` (RED): estado ready/not-found/error; decisão da ação (`deactivate` se ativo, `reactivate` se inativo); gate `canWrite`.
- [x] T026 [P] [US3] `financier-detail/financier-detail.query.ts` (sobre `repository.getById`) + `financier-status.mutation.ts` (deactivate/reactivate, invalida detalhe+lista).
- [x] T027 [US3] `financier-detail/financier-detail.view-model.ts` — derivação de estado + ação de status + gate; até T025 GREEN. (depende de T026)
- [x] T028 [US3] `financier-detail/financier-detail.binding.ts` — `useQuery` + `useMutation` → estado + `statusCommand`. (depende de T027)
- [x] T029 [P] [US3] Componentes locais em `financier-detail/components/`: conteúdo do detalhe (todos os 6 campos + status) + confirmação de status (`confirm-dialog` espelhado, `<dialog>` acessível, só-tokens).
- [x] T030 [US3] `financier-detail/page/financier-detail.page.tsx` — view burra liga estado + ações (gated por `canWrite`); botão "Editar". (depende de T028, T029)
- [x] T031 [US3] Rota `src/routes/_authenticated/parceiros/financiadores/$id.tsx` + regenerar routeTree. (depende de T030)
- [x] T032 [US3] Suites de US3 GREEN + `pnpm lint` verde. (depende de T031)

---

## Phase 6: User Story 4 - Editar financiador (P2)

**Goal**: reusa o form de criação com `initialValues`; update = PUT total; salvar volta ao detalhe.
**Independent Test**: abrir edição pré-preenchida, alterar campo, salvar, ver mudança no detalhe/lista.

- [x] T033 [US4] `financier-edit/financier-edit.query.ts` (pré-preenche via `getFinancierFn`) + `financier-edit.mutation.ts` (`updateFinancierFn`, com `id`) + `.view-model.ts` + `.binding.ts` (navega ao **detalhe** no sucesso). (depende de T006, T021)
- [x] T034 [US4] `financier-edit/page/financier-edit.page.tsx` — reusa `financier-form.component` com `initialValues`; liga ao Command de update. (depende de T033, T020)
- [x] T035 [US4] Rota `src/routes/_authenticated/parceiros/financiadores/$id.editar.tsx` + regenerar routeTree. (depende de T034)
- [x] T036 [US4] Suites/typecheck/lint de US4 verdes. (depende de T035)

---

## Phase 7: Polish & Cross-Cutting

- [x] T037 [P] Ligar o menu: subitem "Financiadores" sob "Gestão de Parceiros" em `shell-menu.config.ts` apontando para `/parceiros/financiadores`, **já com** `requiredPermission: 'financier:read'` (mecânica da 011).
- [x] T038 Estender o teste de regressão de menu em `tests/modules/shell/client/root/root.view-model.test.ts`: com `financier:read` o subitem "Financiadores" aparece; sem ele, não. **Coordenação com a 011** (T037 muda a fixture real do MENU): a seção "Gestão de Parceiros" agora tem 2 subitens, logo passa a sobreviver com `supplier:read` **OU** `financier:read` — cobrir o caso "só `financier:read` → seção aparece com 1 subitem (Financiadores)" e **rodar a suíte inteira** para confirmar que os asserts da 011 (`[]` → some; `['user:read',...]` → some) continuam GREEN. (depende de T037 — testa o MENU já alterado; **não** `[P]`)
- [x] T039 [P] Revisar i18n: nenhuma string literal nas views; todas as tags `partners.financiers.*` existem no catálogo.
- [x] T040 Validar o `quickstart.md` (checklist de conformidade por tela: views burras, núcleo agnóstico, erros→tag, só-tokens, RBAC, organismos, sem categorias/pagamento/e-mail).
- [x] T041 Gate final: `pnpm verify` (typecheck + lint + test) e `pnpm test:dom` verdes; conferir boundaries (client não importa `server/domain|application`; views sem data-hooks).
- [ ] T042 (Opcional) Baseline visual da listagem de financiadores em `e2e/visual/` (rota real autenticada), seguindo a receita do guia — gerar `-linux` com revisão humana.

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2, bloqueia tudo)** → **US1 → US2 → US3 → US4** → **Polish**.
- US1/US2/US3 são majoritariamente independentes após a Foundational; US4 depende do form de US2 (T020) e do repository (T006).
- Rotas (T016/T023/T031/T035) cada uma regenera o `routeTree.gen.ts` — **sequenciar** para evitar corrida.
- Dentro de cada US: teste (RED) → query/mutation → view-model (GREEN) → binding → componentes → page → rota → gate.

## Parallel Opportunities

- **Setup**: T002 (i18n) ‖ T001 (pastas).
- **Foundational**: T003/T004 (schemas) ‖ T005 (model) ‖ T007 (teste repo). T006/T008 sequenciais.
- **Por US**: o teste RED `[P]` e os componentes `[P]` rodam em paralelo ao restante; a page/rota são sequenciais.
- **Polish**: T037 ‖ T039 `[P]` (arquivos distintos); **T038 depende de T037** (testa o MENU já alterado — não `[P]`); T040/T041 sequenciais no fim.

## MVP Scope

- **MVP = US1 (listar)** — entrega navegação e consulta sozinha. Incrementos: US2 (criar), US3 (detalhe+status), US4 (editar). Cada US é uma fatia testável e demonstrável.

## Formato

- Todas as tasks seguem `- [ ] [TaskID] [P?] [Story?] descrição com caminho de arquivo`.
- `[US1..US4]` só nas fases de user story; Setup/Foundational/Polish sem label.
