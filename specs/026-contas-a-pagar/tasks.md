---
description: "Task list — Contas a Pagar (Financeiro) v1 núcleo"
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
- [ ] T013 [P] `src/modules/financial/server/adapters/server-fns/list-documents.query.fn.ts` (GET /documents — devolve vazio na Fatia 1; anexa guard de auth).
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

- [ ] T025 [P] [US1] (RED) Teste puro de `document-form.view` (preview do líquido = bruto − descontos-fonte − retenções − descontos + multa + juros; gating de retenção só NFS-e/RPA; `canSubmit`) em `tests/modules/financial/client/document-create/document-form-view.test.ts`.
- [ ] T026 [P] [US1] (RED) Spec DOM do form (campos obrigatórios, bloco de retenções aparece só p/ NFS-e/RPA, `onSubmit` emite centavos+bps, mensagem de erro por tag, **estado de sucesso lista os títulos gerados** — FR-007) em `tests/modules/financial/client/document-create/document-form.spec.tsx`.

### Implementation for US1

- [ ] T027 [US1] `src/modules/financial/client/document-create/document-form.view.ts` (derivação pura: preview do líquido, `retentionsEnabled`, `canSubmit`).
- [ ] T028 [US1] `src/modules/financial/client/document-create/document-form.controller.ts` (UI-state do form em máquina/`useReducer`, agnóstico de React no núcleo).
- [ ] T029 [US1] `src/modules/financial/client/document-create/create-document.mutation.ts` (`mutationOptions` → `repository.create`).
- [ ] T030 [US1] `src/modules/financial/client/document-create/create-document.binding.ts` (adapter React: `useMutation`, deriva `submitting`/`errorTag`, e no **sucesso** expõe o documento criado + seus `payables` para o estado de sucesso — **FR-007**).
- [ ] T031 [P] [US1] Componentes burros `document-form.component.tsx`, `retentions-block.component.tsx`, `registered-taxes-block.component.tsx`, `net-value-preview.component.tsx` (+ `.css.ts` tokens-only) em `src/modules/financial/client/document-create/components/` — tokens/medidas via **Figma node 205-638** + mock HTML `~/Desktop/CONSULTORIA/Financeiro/contas-a-pagar/`.
- [ ] T032 [US1] `src/modules/financial/client/document-create/page/lancar-documento.page.tsx` (+ `.css.ts`) — view burra (recebe binding por props); inclui o **estado de sucesso** que exibe os **títulos gerados** (pai + filhos) retornados pelo create (**FR-007**).
- [ ] T033 [US1] Ligar a rota `src/routes/financeiro/contas-a-pagar/lancar.tsx` (binding→page); **guard de rota por permissão `fiscal-document:write`** (FR-013); **select de fornecedor** via `#modules/partners/public-api` (lista de Fornecedores).
- [ ] T034 [US1] i18n: tags `financial.create.*` (labels de campos, tipos, formas de pagamento, retenções) + erros `financial.error.*` em `catalog.pt-BR.ts`.

**Checkpoint**: Lançar Documento funcional ponta-a-ponta (cria + preview + gating). MVP entregável.

---

## Phase 4: User Story 2 - Grid de Contas a Pagar (Priority: P2)

**Goal**: tela de entrada do submódulo — grid shell + estado vazio + "Novo Documento".

**Independent Test**: acessar `/financeiro/contas-a-pagar` → colunas + chips + **estado vazio** (lista stub) + botão que leva a Lançar.

### Tests for US2 (RED first) ⚠️

- [ ] T035 [P] [US2] (RED) Teste puro da `contas-a-pagar.view-model` (deriva `loading`/`empty`/`ready`/`error`; lista vazia = `empty`, não `error`) em `tests/modules/financial/client/contas-a-pagar/contas-a-pagar-view-model.test.ts`.
- [ ] T036 [P] [US2] (RED) Spec DOM da página (renderiza colunas + chips chrome + estado vazio; botão "Novo Documento" navega para `/lancar`) em `tests/modules/financial/client/contas-a-pagar/contas-a-pagar.spec.tsx`.

### Implementation for US2

- [ ] T037 [US2] `src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.query.ts` (`queryOptions` da lista → `repository.list`).
- [ ] T038 [US2] `src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts` (derivação pura do estado).
- [ ] T039 [US2] `src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.binding.ts` (adapter React: `useQuery`).
- [ ] T040 [P] [US2] Componentes burros `grid-head`, `document-row`, `status-chips` (chrome, sem filtrar), `empty-state`, `footer-totais`, `pagination-chrome` (+ `.css.ts` tokens-only) em `src/modules/financial/client/contas-a-pagar-list/components/` — tokens via Figma 205-638 + mock HTML.
- [ ] T041 [US2] `src/modules/financial/client/contas-a-pagar-list/page/contas-a-pagar.page.tsx` (+ `.css.ts`) — view burra.
- [ ] T042 [US2] Ligar a rota `src/routes/financeiro/contas-a-pagar/index.tsx` (binding→page) com **guard de rota por `fiscal-document:read`** e adicionar o item **Financeiro → Contas a Pagar** ao menu (`src/modules/shell/client/data/menu/shell-menu.config.ts`), **gated pela mesma permissão** (FR-013).
- [ ] T043 [US2] i18n: tags `financial.list.*` (títulos de coluna, rótulos de status, estado vazio, "Novo Documento").

**Checkpoint**: Grid shell funcional; US1 + US2 independentes e testáveis.

---

## Phase 5: User Story 3 - Ciclo de vida (Priority: P3) — ⏸️ DEFERIDO (onda 2, fora do v1)

**Goal (futuro)**: aprovar/desfazer/ajustar/cancelar via **drawer de detalhes**.

> **Não implementar no v1.** As 7 server fns (incl. adjust/approve/undo/cancel — T016–T019) já ficam prontas na Onda 1a. A **superfície de UI** (drawer + ações) é **onda 2**, conforme a anotação do próprio design ("corpo na onda 2"). Também deferidos para depois: **seleção em massa + Mudar Status em lote + Exportar (PDF/CSV/CNAB)**, **busca/ordenação/contadores reais**, e — por decisão da usuária — **"Filtro Adicionar" + "Visões Salvas" como a última coisa de todo o módulo**.

- [ ] T044 [US3] (DEFERIDO) Placeholder: drawer + ações de ciclo de vida — abrir slice `document-detail/` espelhando o padrão quando a onda 2 entrar.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T045 [P] Escrever o handoff `handbook/core-api/tickets/FIN-LIST-DTO.md` (backend enriquecer o DTO da lista — hoje só id/status/número/tipo/supplierRef/líquido/vencimento; faltam bruto/emissão/forma-pag/contrato/fornecedor-nome/série).
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
