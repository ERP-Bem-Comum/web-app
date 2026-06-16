---
description: 'Task list — Contas a Pagar (Financeiro) v1 núcleo'
---

# Tasks: Contas a Pagar (Financeiro) — v1 núcleo

**Input**: Design documents from `specs/026-contas-a-pagar/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/README.md ✓

**Tests**: INCLUÍDOS — a usuária pediu **TDD** (constituição §XI + fluxo). Lógica pura → `node:test` (`*.test.ts`, RED antes); telas/form → Vitest jsdom (`*.spec.tsx`).

**Organization**: por user story (spec.md). Faseamento = ondas do plano (1a foundational → 1c US1 → 1b US2 → onda 2 deferida).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paraleliza (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 (Lançar), US2 (Grid), US3 (Ciclo de vida — deferido)
- Espelhar `src/modules/auth/` e `src/modules/users/`. Caminhos relativos à raiz do repo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: estrutura do módulo + esqueleto de rotas + namespace i18n.

- [ ] T001 Criar a estrutura do módulo `src/modules/financial/` (pastas `server/{domain,application,adapters/{core-api,server-fns}}`, `client/{data/{model,helpers,repository},contas-a-pagar-list,document-create}`, `public-api/`) espelhando `src/modules/users/`, e o espelho `tests/modules/financial/`.
- [ ] T002 [P] Criar o namespace i18n `financial.*` em `src/shared/i18n/catalog.pt-BR.ts` (placeholders das tags de erro `financial.error.*` e labels base — preenchidos nas stories).
- [ ] T003 [P] Criar esqueleto das rotas `src/routes/financeiro/contas-a-pagar/index.tsx` e `src/routes/financeiro/contas-a-pagar/lancar.tsx` (placeholders que serão ligados às bindings nas stories).

---

## Phase 2: Foundational (Onda 1a — server + dados, sem UI)

**Purpose**: a borda BFF inteira (domínio, schemas, cliente core-api, use-cases, 7 server fns, repository) — **bloqueia todas as stories de UI**.

**⚠️ CRITICAL**: nenhuma story de UI começa antes desta fase.

### Domínio + dinheiro (TDD)

- [ ] T004 [P] (RED) Teste puro de dinheiro reais↔centavos + `Intl` BRL em `tests/modules/financial/server/domain/money.test.ts`.
- [ ] T005 [P] Implementar `src/modules/financial/server/domain/money.value-object.ts` (parse/format centavos; reuso do padrão de contratos se houver).
- [ ] T006 Criar `src/modules/financial/server/domain/document.io.ts` — tipos I/O puros: enums (`DocumentType`/`PaymentMethod`/`DocumentStatus`/`RetentionType`/`RegisteredTaxType`/`PayableKind`), `FinancialError`, `Document`/`DocumentDetail`/`DocumentSummary`/`Payable`, inputs (`CreateDocumentInput`/`AdjustDocumentInput`/`ApproveInput`/`CancelInput`/`ListDocumentsInput`).

### Schemas de borda (Zod)

- [ ] T007 Criar `src/modules/financial/server/adapters/financial.io-schemas.ts` — Zod de INPUT (Create/Adjust/Approve/List/Id) com money string-centavos (`^\d+$`), datas `YYYY-MM-DD`, `rateBps` int; asserts `≡` aos tipos de `document.io.ts`.
- [ ] T008 Criar `src/modules/financial/server/adapters/core-api/financial.schema.ts` — Zod de RESPONSE (`CoreApiDocument`, `CoreApiPayable`, `CoreApiDocumentList` flat).

### Cliente core-api + mappers + erro (TDD)

- [ ] T009 [P] (RED) Teste puro de mappers API→model e `mapHttpError` (slug→`FinancialError`: document-not-found, invalid-state-transition, net-value-not-positive, retention-not-allowed-for-type, document-incomplete, validation, 401/403, conn) em `tests/modules/financial/server/adapters/core-api/financial-mappers.test.ts`.
- [ ] T010 Implementar `src/modules/financial/server/adapters/core-api/core-api-financial.ts` — 7 chamadas a `/api/v2/financial` (list/get/create/adjust/approve/undo/cancel), money/data/bps na borda, `detailToModel`/`listToModel`, `mapHttpError`. Espelha `core-api-users.ts`/`core-api-contracts.ts`.

### Use-cases + composição + server fns

- [ ] T011 Criar `src/modules/financial/server/application/financial.use-cases.ts` — porta `FinancialClient` + use-cases (sem throw, devolvem `Result`).
- [ ] T012 Criar `src/modules/financial/server/adapters/financial.composition.ts` (injeta o client core-api).
- [ ] T013 [P] `src/modules/financial/server/adapters/server-fns/list-documents.query.fn.ts` (GET /documents — **passa pela lista real paginada/filtrada** do backend Fatia 2; anexa guard de auth).
- [ ] T014 [P] `.../server-fns/get-document.query.fn.ts` (GET /documents/:id).
- [ ] T015 [P] `.../server-fns/create-document.service.fn.ts` (POST /documents, asDraft:false; valida `CreateDocumentInput`).
- [ ] T016 [P] `.../server-fns/adjust-document.service.fn.ts` (PATCH /documents/:id).
- [ ] T017 [P] `.../server-fns/approve-document.service.fn.ts` (POST /documents/:id/approve).
- [ ] T018 [P] `.../server-fns/undo-approval.service.fn.ts` (POST /documents/:id/undo-approval).
- [ ] T019 [P] `.../server-fns/cancel-document.service.fn.ts` (DELETE /documents/:id).

### Client data (TDD) + public-api

- [ ] T020 [P] (RED) Teste puro de `financialErrorTag` (switch exaustivo com guarda `never`) em `tests/modules/financial/client/data/financial-error-tag.test.ts`.
- [ ] T021 Criar `src/modules/financial/client/data/repository/financial-error.ts` (union) + `src/modules/financial/client/data/helpers/financial-error-tag.ts` (`FinancialError`→tag i18n).
- [ ] T022 Criar `src/modules/financial/client/data/model/document.model.ts` (model do client — espelha `document.io.ts`).
- [ ] T023 Criar `src/modules/financial/client/data/repository/financial.repository.ts` + `financial.repository.instance.ts` (porta → server fns).
- [ ] T024 Criar `src/modules/financial/public-api/index.ts` — exporta server fns, tipos do model, `queryOptions`/`mutationOptions` (único ponto de import externo, §I).

**Checkpoint**: borda BFF pronta e testada (puros verdes). UI pode começar.

---

## Phase 3: User Story 1 - Lançar Documento (Priority: P1) 🎯 MVP

**Goal**: operador registra um documento fiscal `Open`; backend gera título pai + filhos por retenção.

**Independent Test**: ir direto a `/financeiro/contas-a-pagar/lancar`, preencher NFS-e com fornecedor/valores/retenção ISS, confirmar → documento `Aberto` com pai + filho ISS (via `GET /:id`).

### Tests for US1 (RED first) ⚠️

- [ ] T025 [P] [US1] (RED) Teste puro de `document-form.view` (preview do líquido; gating de retenção só NFS-e/RPA; **agregação CSRF = PIS+COFINS+CSLL** no input e no preview de "Títulos Previstos" pai+ISS/IRRF/INSS/CSRF; `canSubmit`) em `tests/modules/financial/client/document-create/document-form-view.test.ts`.
- [ ] T026 [P] [US1] (RED) Spec DOM do form (campos obrigatórios, bloco de retenções aparece só p/ NFS-e/RPA, `onSubmit` emite centavos+bps, mensagem de erro por tag, **estado de sucesso lista os títulos gerados** — FR-007) em `tests/modules/financial/client/document-create/document-form.spec.tsx`.

### Implementation for US1

- [ ] T027 [US1] `src/modules/financial/client/document-create/document-form.view.ts` (derivação pura: preview do líquido, `retentionsEnabled`, **agregação CSRF (PIS+COFINS+CSLL → 1 retenção `CSRF`)** ao montar o `CreateDocumentInput` e os "Títulos Previstos", `canSubmit`).
- [ ] T028 [US1] `src/modules/financial/client/document-create/document-form.controller.ts` (UI-state do form em máquina/`useReducer`, agnóstico de React no núcleo).
- [ ] T029 [US1] `src/modules/financial/client/document-create/create-document.mutation.ts` (`mutationOptions` → `repository.create`).
- [ ] T030 [US1] `src/modules/financial/client/document-create/create-document.binding.ts` (adapter React: `useMutation`, deriva `submitting`/`errorTag`, e no **sucesso** expõe o documento criado + seus `payables` para o estado de sucesso — **FR-007**).
- [ ] T031 [P] [US1] Componentes burros (form **manual**, sem PDF/OCR) em `src/modules/financial/client/document-create/components/` (+ `.css.ts` tokens-only): `document-form.component.tsx`, `identificacao-block` (tipo/nº/série/vencimento/bruto/descrição — **sem** competência/emissão), `retentions-block.component.tsx` (**6 inputs**: ISS/IRRF/INSS/PIS/COFINS/CSLL), `registered-taxes-block.component.tsx` (CBS/IBS, leitura), `net-value-preview.component.tsx`, `titulos-previstos.component.tsx` (pai+filhos com CSRF), `categorizacao-readonly.component.tsx` (**herdada do contrato vinculado**, read-only). **Gated/omitir no v1:** painel PDF/OCR, Validação/Divergência, Aprovador, conta-débito. Referência principal = **mock HTML** `~/Desktop/CONSULTORIA/Financeiro/contas-a-pagar/lancar-documento/` (o Figma desta tela está incompleto); tokens do grid via Figma node 205-638.
- [ ] T032 [US1] `src/modules/financial/client/document-create/page/lancar-documento.page.tsx` (+ `.css.ts`) — view burra (recebe binding por props); inclui o **estado de sucesso** que exibe os **títulos gerados** (pai + filhos) retornados pelo create (**FR-007**).
- [ ] T033 [US1] Ligar a rota `src/routes/financeiro/contas-a-pagar/lancar.tsx` (binding→page); **guard de rota por permissão `fiscal-document:write`** (FR-013); **select de fornecedor** via `#modules/partners/public-api` (lista de Fornecedores).
- [ ] T034 [US1] i18n: tags `financial.create.*` (labels de campos, tipos, formas de pagamento, retenções) + erros `financial.error.*` em `catalog.pt-BR.ts`.

**Checkpoint**: Lançar Documento funcional ponta-a-ponta (cria + preview + gating). MVP entregável.

---

## Phase 4: User Story 2 - Grid de Contas a Pagar (Priority: P2)

**Goal**: tela de entrada do submódulo — grid com **listagem real paginada** (Fatia 2) + estado vazio (fallback) + "Novo Documento".

> **Reconciliação Fatia 2 (2026-06-16):** `GET /documents` deixou de ser stub — agora é **lista real, paginada e filtrável** (status/supplierRef/type/dueFrom/dueTo, ordenação estável). A US2 passa de "shell + estado vazio" para **listar documentos de verdade**; o estado vazio vira **fallback** (base sem registros). Colunas finas do DTO atual (tipo/número/fornecedor/líquido/vencimento/situação); as ricas (Contrato/Forma Pag./Emissão/Bruto) ficam gated até `FIN-LIST-DTO` ([core-api#47](https://github.com/ERP-Bem-Comum/core-api/issues/47)).

**Independent Test**: acessar `/financeiro/contas-a-pagar` → grid **lista os documentos** (colunas finas, paginado); base vazia → **estado vazio** (não erro); botão "Novo Documento" leva a Lançar.

### Tests for US2 (RED first) ⚠️

- [x] T035 [P] [US2] (RED) Teste puro da `contas-a-pagar.view-model` (deriva `loading`/`empty`/`ready`/`error`; **`ready` lista os itens** + expõe a paginação; lista vazia = `empty`, não `error`) em `tests/modules/financial/client/contas-a-pagar/contas-a-pagar-view-model.test.ts`.
- [x] T036 [P] [US2] (RED) Spec DOM da página (**renderiza linhas de uma lista real** + cabeçalhos + chrome de paginação; base vazia → estado vazio; botão "Novo Documento" navega para `/lancar`) em `tests/modules/financial/client/contas-a-pagar/contas-a-pagar.spec.tsx`.

### Implementation for US2

- [x] T037 [US2] `src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.query.ts` (`queryOptions` da lista → `repository.list`, **com page/pageSize**; a lista é real na Fatia 2).
- [x] T038 [US2] `src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts` (derivação pura do estado — `ready` mapeia os `items` para linhas + dados de paginação).
- [x] T039 [US2] `src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.binding.ts` (adapter React: `useQuery`).
- [x] T040 [P] [US2] Componentes burros `grid-head`, `document-row` (**renderiza um `DocumentSummary` real**), `status-chips` (chrome — sem contadores por aba no v1), `empty-state` (fallback), `footer-totais`, `pagination-chrome` (**ligado a page/pageSize**) (+ `.css.ts` tokens-only) em `src/modules/financial/client/contas-a-pagar-list/components/` — tokens via Figma 205-638 + mock HTML.
- [x] T041 [US2] `src/modules/financial/client/contas-a-pagar-list/page/contas-a-pagar.page.tsx` (+ `.css.ts`) — view burra.
- [x] T042 [US2] Ligar a rota `src/routes/financeiro/contas-a-pagar/index.tsx` (binding→page) com **guard de rota por `fiscal-document:read`** e adicionar o item **Financeiro → Contas a Pagar** ao menu (`src/modules/shell/client/data/menu/shell-menu.config.ts`), **gated pela mesma permissão** (FR-013).
- [x] T043 [US2] i18n: tags `financial.list.*` (títulos de coluna, rótulos de status, estado vazio, "Novo Documento").

**Checkpoint**: Grid com listagem real paginada funcional; US1 + US2 independentes e testáveis.

> **Nota (onda 2, US3):** com a Fatia 2 o **optimistic lock passou a ser exigido** (409 `document-version-conflict`) em ajustar/aprovar/desfazer. Quando a UI de ciclo de vida (drawer/onda 2) descer, ela MUST tratar esse conflito (tag i18n própria + recarregar o documento). Garantir que o mapper/error-tag do financeiro cobre o slug `document-version-conflict`.

---

## Phase 5: User Story 3 - Ciclo de vida (Priority: P3) — ⏸️ DEFERIDO (onda 2, fora do v1)

**Goal (futuro)**: aprovar/desfazer/ajustar/cancelar via **drawer de detalhes**.

> **Não implementar no v1.** As 7 server fns (incl. adjust/approve/undo/cancel — T016–T019) já ficam prontas na Onda 1a. A **superfície de UI** (drawer + ações) é **onda 2**, conforme a anotação do próprio design ("corpo na onda 2"). Também deferidos para depois: **seleção em massa + Mudar Status em lote + Exportar (PDF/CSV/CNAB)**, **busca/ordenação/contadores reais**, e — por decisão da usuária — **"Filtro Adicionar" + "Visões Salvas" como a última coisa de todo o módulo**.

- [ ] T044 [US3] (DEFERIDO) Placeholder: drawer + ações de ciclo de vida — abrir slice `document-detail/` espelhando o padrão quando a onda 2 entrar.

---

## Phase 6: Polish & Cross-Cutting

- [x] T045 [P] Handoffs de backend abertos como **GitHub issues** (padrão do tech lead): **FIN-LIST-DTO** → ERP-Bem-Comum/core-api#47 · **FIN-CREATE-DTO** → ERP-Bem-Comum/core-api#48.
- [ ] T046 Rodar `pnpm verify` (typecheck + lint + `test` + `test:dom`) verde; corrigir qualquer regressão (regra de regressão-zero).
- [ ] T047 Gerar baselines visuais Playwright das 2 telas (`e2e/visual/`), com revisão humana do diff — nunca `test:visual:update` cego.
- [ ] T048 Validar `quickstart.md` (smoke manual contra a stack `app.localhost`).

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2, Onda 1a)** bloqueia tudo de UI.
- Depois do Foundational, **US1 (P1)** e **US2 (P2)** são independentes (podem ir em paralelo; US1 é o MVP por prioridade).
- **US3 (P3)** deferido (onda 2) — não bloqueia nada do v1.
- **Polish** depois das stories do v1.

### Within each task group

- Teste (RED) **antes** da implementação (T004→T005, T009→T010, T020→T021, T025/26→T027+, T035/36→T037+).
- `document.io` (T006) antes de schemas (T007/08) antes do client core-api (T010) antes de use-cases (T011) antes das server fns (T013–T019) antes do repository (T023) antes das bindings de UI.

## Parallel Opportunities

- Setup: T002, T003 em paralelo.
- Foundational: T004/T009/T020 (testes RED) em paralelo; as 7 server fns T013–T019 em paralelo (arquivos distintos) após T011/T012.
- US1 e US2: stories inteiras em paralelo após o Foundational; dentro de cada uma, os testes [P] e os componentes [P] em paralelo.

## Implementation Strategy

1. **MVP** = Setup + Foundational + **US1 (Lançar Documento)** → validar isolado → demo.
2. Incremento: **US2 (Grid)** → validar isolado → demo.
3. **Onda 2** (US3 + bulk/export/filtros) depois, fora do v1.
4. `pnpm verify` + `pnpm test:visual` verdes antes de fechar cada story (regressão-zero).

## Notes

- `[P]` = arquivos diferentes, sem dependência pendente.
- Verificar que os testes RED **falham** antes de implementar.
- Commit por grupo lógico (a usuária commitará — não auto-commitar sem pedido).
- Espelhar fielmente `auth`/`users`: postfix de arquivo = camada (§XI), errors-as-values (§II), server-fn única fronteira (§III), tokens-only (§X), i18n (§X).
