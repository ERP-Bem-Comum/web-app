---
description: 'Task list — Conciliação Bancária (034)'
---

# Tasks: Conciliação Bancária

**Input**: Design documents from `/specs/034-bank-reconciliation/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: **INCLUÍDOS** — a spec pede TDD explicitamente (Assumptions + plan.md › W0). Puros
(`*.test.ts`, `node:test`, imports relativos) escritos **antes** da implementação; DOM (`*.spec.tsx`,
Vitest/jsdom) para interação.

**Organização**: por user story (P1→P3), cada uma entregável e testável de forma independente. Submódulo
`bank-reconciliation` dentro de `src/modules/financial/`, espelhando `contas-a-pagar-list`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos distintos, sem dependência pendente)
- **[Story]**: US1…US8 (fases de história) — Setup/Foundational/Polish não têm label
- Caminhos de arquivo são exatos.

## Convenções deste repo

- Server: `domain → application → adapters/{core-api, server-fns}`; a server fn é a única fronteira.
- Client: `data/{model,repository,gateway} → <feature>/{view-model,query,binding,page,components}`.
- Postfixes: `.server-fn.ts` (aqui `*.service.fn.ts`/`*.query.fn.ts`), `.view-model.ts`, `.binding.ts`,
  `.query.ts`, `.component.tsx`, `.page.tsx`, `.css.ts`, `.schema.ts`, `.mappers.ts`.
- Tokens-only (`vars.*`); strings de UI = tags i18n; erros como valores; sem `class`/`throw` fora da borda.
- Após editar: `pnpm lint:fix`; antes de concluir uma fase: `pnpm verify` + `pnpm test:dom`.

---

## Phase 1: Setup (infra compartilhada do submódulo)

**Purpose**: criar o esqueleto de pastas, rotas e wiring sem lógica de dados.

- [x] T001 Criar a árvore de pastas do submódulo client em `src/modules/financial/client/reconciliation-accounts/{page,components}` e `src/modules/financial/client/reconciliation-workspace/{page,components}` (arquivos `.gitkeep` provisórios se necessário).
- [x] T002 [P] Criar as rotas file-based `src/routes/_authenticated/financeiro/conciliacao/index.tsx` (TELA 1) e `src/routes/_authenticated/financeiro/conciliacao/$accountId.tsx` (TELA 2) como composition roots que apenas montam as páginas (sem data-hooks na rota além de loader/guard).
- [x] T003 [P] Adicionar o item "Conciliação" no submenu Financeiro da sidebar apontando para `/financeiro/conciliacao` (localizar e estender o componente de navegação existente do Financeiro).
- [x] T004 [P] Criar o namespace de tags i18n PT-BR de conciliação em `src/shared/i18n` (chaves de erro do contrato + rótulos das telas), espelhando o que Contas a Pagar usa.
- [ ] T005 Estender `src/modules/financial/public-api/index.ts` para reexportar (placeholders) as duas páginas e os tipos públicos do submódulo.

**Checkpoint**: `pnpm typecheck` verde com as rotas/pastas vazias montando sem erro.

---

## Phase 2: Foundational (pré-requisitos bloqueantes — antes de qualquer US)

**Purpose**: domínio, erros, cliente core-api base, repositório-porta e o **shell do workspace +
seletor de conta (seed)** — compartilhados por US1/US2 em diante.

⚠️ **Bloqueia todas as histórias.**

### Domínio & erros (puro, TDD)

- [x] T006 [P] Teste (RED) dos VOs branded em `tests/modules/financial/server/domain/reconciliation.io.test.ts` (AccountRef/PayableId/TransactionId/StatementId/ReconciliationId/PeriodId, `Cents`, `IsoDate`, `Score` — smart constructors retornando `Result`).
- [x] T007 Implementar os VOs e tipos de domínio em `src/modules/financial/server/domain/reconciliation.io.ts` (unions discriminadas de D9: movement, reconciliationStatus, reconciliation type, manual-entry type, difference treatment, suggestion band) até T006 passar.
- [x] T008 [P] Teste (RED) do mapeamento de erros em `tests/modules/financial/client/data/reconciliation-error-tag.test.ts` (cada `kind` do contrato → tag i18n; `switch` exaustivo com `const _: never`).
- [x] T009 Estender os erros como valor em `src/modules/financial/server/domain/errors/financial.errors.ts` e o mapeamento em `src/modules/financial/client/data/helpers/financial-error-tag.ts` com os `kind` de conciliação (ver `contracts/server-fns.md`), até T008 passar.

### Cliente core-api base + repositório-porta

- [x] T010 Estender o cliente em `src/modules/financial/server/adapters/core-api/core-api-financial.ts` com o helper de chamada ao namespace `/api/v2/financial` para conciliação (reuso do `resultFetch`/auth já existente; nada de endpoint novo no core-api).
- [x] T011 [P] Criar o model Zod do client em `src/modules/financial/client/data/model/reconciliation.model.ts` (BankStatement, StatementTransaction, PaidPayable, MatchSuggestion, Reconciliation, ManualEntry, ReconciliationPeriod — campos de fornecedor/nº doc **opcionais**, mínimo até #172). ⚠️ Verificado #152: `entryType` = **string livre** (não enum); `payables.dueDate` = **date-only `YYYY-MM-DD`**; raiz de suggestions = **`{ suggestions }`** (não `items`); `band: ['alta','media']`; `difference.valueCents` = **int (pode negativo)**.
- [x] T012 Estender a porta `src/modules/financial/client/data/repository/financial.repository.ts` (+ `financial.repository.instance.ts`) com as assinaturas finais de conciliação (import, listTransactions, listPaidPayables, getSuggestions, rejectSuggestion, reconcile, undo, manualEntry, batch, closePeriod, **listAccounts/getAccount = costura #168**, export = costura #173) devolvendo `Result`.

### Shell do workspace + seletor de conta (seed) — compartilhado US1/US2

- [x] T013 [P] Teste (RED) DOM do shell em `tests/modules/financial/client/reconciliation-workspace/reconciliation-workspace.page.spec.tsx` (header da conta, tabs Extrato|Conciliação, toggle "Exibir palpites", bottombar — sem dados ainda).
- [x] T014 Implementar o shell da TELA 2: `src/modules/financial/client/reconciliation-workspace/page/reconciliation-workspace.page.tsx` (+ `.css.ts` tokens-only) com acc-header, tabs e bottombar burros, recebendo tudo por props da view-model. Fidelidade ao mock `conciliacao_bancaria` (Figma node 8:7).
- [x] T015 Criar a view-model base do workspace em `src/modules/financial/client/reconciliation-workspace/reconciliation-workspace.view-model.ts` (UI-state via reducer: activeTab, showGuesses, period, listFilter, selectedTransactionId, assocTab) e `reconciliation-workspace.query.ts` (query keys por conta/extrato).
- [x] T016 Criar `account-selector.binding.ts` em `reconciliation-workspace/` — **seletor temporário com UUID v4 fixo de placeholder** (constante local; verificado no #152: não há conta de seed nem UUID conhecido, e o import não valida o ref). Reusar o **mesmo** uuid em todas as chamadas correlacionadas do extrato. A porta `getAccount` devolve "indisponível" (#168) sem fabricar dados (chrome honesto, D2). Liga ao grid real (`listAccounts`) quando #168 chegar.

**Checkpoint**: workspace abre em `/financeiro/conciliacao/$accountId` com shell fiel, tabs e seletor de
conta (seed) funcionando; `pnpm verify` + `pnpm test:dom` verdes. Nenhuma US implementada ainda.

---

## Phase 3: User Story 1 — Conciliar por sugestão (Priority: P1) 🎯 MVP

**Goal**: selecionar uma transação, ver a sugestão de match (lado a lado + critérios + confiança),
**Conciliar** (1:1) ou **Rejeitar** (não reaparece).

**Independent Test**: com extrato importado e títulos Pago, selecionar transação com palpite alta →
Conciliar → sai dos pendentes e progresso sobe; Rejeitar → some e mostra alternativas.

### BFF (server fns) — listar transações, payables Pago, sugestões, conciliar, rejeitar

- [x] T017 [P] [US1] Teste (RED) dos mappers em `tests/modules/financial/server/adapters/reconciliation-read.mappers.test.ts` (response core-api → StatementTransaction[], PaidPayable[], MatchSuggestion[]).
- [x] T018 [US1] Estender `src/modules/financial/server/adapters/core-api/financial.schema.ts` e `financial.mappers.ts` com os schemas/mapeamento de transações, payables Pago e sugestões, até T017 passar.
- [x] T019 [P] [US1] Criar `src/modules/financial/server/adapters/server-fns/list-statement-transactions.query.fn.ts` (input `{statementId}` via `financial.io-schemas.ts`; valida response; `mapToServerResponse`).
- [x] T020 [P] [US1] Criar `src/modules/financial/server/adapters/server-fns/list-paid-payables.query.fn.ts` (`GET /payables?status=Paid`; só Pago).
- [x] T021 [P] [US1] Criar `src/modules/financial/server/adapters/server-fns/get-transaction-suggestions.query.fn.ts` (input `{transactionId}`).
- [x] T022 [US1] Criar `src/modules/financial/server/adapters/server-fns/create-reconciliation.service.fn.ts` (input `{transactionId, payableIds, difference?}`) e `reject-suggestion.service.fn.ts` (input `{transactionId, payableId}`); wiring em `financial.composition.ts`.

### Client — view-model derivações, queries/bindings, UI da aba Sugestão

- [x] T023 [US1] Teste (RED) puro das derivações da view-model em `tests/modules/financial/client/reconciliation-workspace/workspace-derivations.test.ts` (agrupar transações por dia; filtro Pendentes/Conciliadas/Todas; progresso "conciliado X/N"; tag de palpite alta/média/sem match/conciliado; **heurística `entryType`→ícone com fallback por `movement`**, incluindo um `entryType` desconhecido caindo no fallback).
- [x] T024 [US1] Implementar essas derivações puras na `reconciliation-workspace.view-model.ts` e ligar as queries em `reconciliation-workspace.query.ts` (transações, payables Pago, sugestões) via repository, até T023 passar.
- [x] T025 [P] [US1] Criar `reconcile.binding.ts` (conciliar 1:1 + invalidações: transações/progresso) e estender o tracking de **sugestões rejeitadas** (UI-state + refetch) em `reconciliation-workspace/`.
- [x] T026 [US1] Implementar a coluna ESQUERDA (imports-list agrupada por dia, tag de palpite, filtro Pendentes/Conciliadas/Todas) em `components/imports-list.component.tsx` (+ `.css.ts`), view burra. **Ícone via heurística** sobre `entryType` normalizado (string livre: `FEE`/`TAR`, `INT`/`JUR`, `XFER`/`TED`/`DOC`, `APLIC`/`INVEST`, `RESG`/`REDEM`) **com fallback por `movement`** (entrada/saída) — nunca union fechado. Fidelidade ao mock.
- [x] T027 [US1] Implementar a aba **Sugestão** em `components/suggestion-pane.component.tsx` (+ `.css.ts`): match card lado a lado (extrato × título, **mínimo** até #172), critérios + confiança, botões Conciliar/Rejeitar, "outras possibilidades".
- [x] T028 [US1] Teste (RED→GREEN) DOM em `tests/modules/financial/client/reconciliation-workspace/suggestion-pane.spec.tsx` (selecionar transação → Conciliar move p/ conciliada e sobe progresso; Rejeitar some e não reaparece; transação sem palpite mostra estado vazio + ofertas Nova/Buscar).

**Checkpoint**: US1 demonstrável de ponta a ponta (com extrato já presente). MVP entregável.

---

## Phase 4: User Story 2 — Importar extrato (OFX/CSV) (Priority: P1)

**Goal**: importar OFX/CSV, ver "{N} importadas · {M} duplicadas · período"; PDF desabilitado (#145).

**Independent Test**: importar OFX válido → resumo + transações na lista; reimportar → "0 importadas / N
duplicadas".

- [x] T029 [P] [US2] Teste (RED) do mapper de import em `tests/modules/financial/server/adapters/import-statement.mapper.test.ts` (response → BankStatement {statementId, imported, duplicatesDiscarded, period}).
- [x] T030 [US2] Estender `financial.schema.ts`/`financial.mappers.ts` para o import e criar `src/modules/financial/server/adapters/server-fns/import-bank-statement.service.fn.ts` (input `{debitAccountRef, format:'OFX'|'CSV', content, fileName?}`; mapeia erros 400/409/422), até T029 passar; wiring na composition.
- [x] T031 [US2] Criar `import.binding.ts` em `reconciliation-workspace/`: lê o arquivo via `File.text()`, chama a porta `import`, invalida a query de transações; trata erros → tags i18n.
- [x] T032 [US2] Implementar `components/import-menu.component.tsx` (+ `.css.ts`): menu Importar com OFX/CSV ativos e **PDF desabilitado/anunciado** (#145); exibe o resumo pós-import. View burra. Fidelidade ao mock.
- [x] T033 [US2] Teste (RED→GREEN) DOM em `tests/modules/financial/client/reconciliation-workspace/import-menu.spec.tsx` (import válido mostra resumo e popula lista; formato inválido mostra erro claro; período fechado bloqueia; PDF desabilitado).

**Checkpoint**: US1 + US2 = caminho feliz completo (importar → conciliar por sugestão).

---

## Phase 5: User Story 3 — N:1 e parcial (Buscar/Criar vários) (Priority: P2)

**Goal**: multi-seleção de títulos Pago, soma vs valor do extrato, classificação da diferença
(Juros/Multa/Desconto/Tarifa/Parcial); conciliar bloqueado enquanto não balancear.

**Independent Test**: 2 títulos cuja soma bate → conciliar N:1; soma diferente → classificar → parcial.

- [x] T034 [P] [US3] Teste (RED) puro da **regra de balanceamento** em `tests/modules/financial/client/reconciliation-workspace/balance.test.ts` (Σ títulos + difference === |valor transação|; deriva type Individual/Multiple/Partial; gating do botão).
- [x] T035 [US3] Implementar a função pura de balanceamento + gating na view-model (`reconciliation-workspace.view-model.ts`) e `search-create.binding.ts` (multi-seleção + difference em UI-state), até T034 passar.
- [x] T036 [US3] Implementar a aba **Buscar/Criar vários** em `components/search-create-pane.component.tsx` (+ `.css.ts`): grid de títulos Pago com multi-seleção, soma comparada ao valor, seletor de tratamento da diferença, botão Conciliar com estado bloqueado/aviso. Reusa `create-reconciliation.service.fn.ts` (T022).
- [x] T037 [US3] Teste (RED→GREEN) DOM em `tests/modules/financial/client/reconciliation-workspace/search-create-pane.spec.tsx` (N:1 balanceado concilia; diferença sem classificação bloqueia; diferença classificada concilia parcial).

**Checkpoint**: conciliação N:1 e parcial funcionando sobre o mesmo endpoint.

---

## Phase 6: User Story 4 — Lançamento manual (+ lote) (Priority: P2)

**Goal**: classificar transação sem título (6 tipos); Transferência/Aplicação/Resgate exigem destino +
confirmação consciente; conciliar em lote (best-effort).

**Independent Test**: tarifa → "Tarifa/Multa/Juros" + categorizar → registrada; transferência → exige
destino + confirmação.

- [x] T038 [P] [US4] Teste (RED) puro do gating de confirmação consciente em `tests/modules/financial/client/reconciliation-workspace/manual-entry.test.ts` (Transfer/Investment/Redemption bloqueiam submit sem destino+confirmação; demais tipos liberam).
- [x] T039 [US4] Criar `src/modules/financial/server/adapters/server-fns/create-manual-entry.service.fn.ts` (input com `type` + refs opcionais + `destinationAccount?`) e `batch-reconcile.service.fn.ts` (input `{transactionIds, template}`, retorna `created/failed`); schemas/mapper + composition.
- [x] T040 [US4] Implementar `manual-entry.binding.ts` (+ gating de T038) e a aba **Nova transação** em `components/new-transaction-pane.component.tsx` (+ `.css.ts`): cards de tipo, categorização, conta de destino + confirmação consciente para Transfer/Investment/Redemption.
- [ ] T041 [US4] Implementar a ação de **lote** (best-effort) a partir de seleção múltipla na imports-list (`batch.binding.ts` + UI de seleção/relatório de `failed`).
- [x] T042 [US4] Teste (RED→GREEN) DOM em `tests/modules/financial/client/reconciliation-workspace/new-transaction-pane.spec.tsx` (tipo simples registra; transferência sem destino/confirmação bloqueia; lote reporta falhas parciais).

**Checkpoint**: o operador consegue "zerar" o extrato (todas as movimentações tratadas).

---

## Phase 7: User Story 5 — Desfazer conciliação (Priority: P2)

**Goal**: desfazer uma conciliação (motivo opcional); transação volta a pendente, título a Pago,
registro preservado como "desfeito".

**Independent Test**: abrir detalhes de uma conciliada → Desfazer → volta a pendente.

- [x] T043 [US5] Criar `src/modules/financial/server/adapters/server-fns/undo-reconciliation.service.fn.ts` (input `{reconciliationId, reason?}`; mapeia 409 already-undone/period-closed); schema/mapper + composition.
- [x] T044 [US5] Implementar `undo.binding.ts` (invalida transações/progresso) e `components/detail-modal.component.tsx` (+ `.css.ts`): detalhes da conciliação com botão Desfazer + campo de motivo. View burra.
- [x] T045 [US5] Teste (RED→GREEN) DOM em `tests/modules/financial/client/reconciliation-workspace/detail-modal.spec.tsx` (desfazer volta a pendente; período fechado bloqueia com aviso).

**Checkpoint**: correção de erros disponível; trilha de auditoria preservada.

---

## Phase 8: User Story 6 — Grid de contas + adicionar conta (Priority: P3) — chrome honesto (#168)

**Goal**: TELA 1 fiel ao mock `grid_conciliacao` com busca/filtros/ordenação; clicar conta ativa abre o
workspace; encerrada não abre. **Dados reais só após #168** → chrome honesto.

**Independent Test**: abrir Conciliação → ver grid; filtrar; clicar conta abre workspace; encerrada
impedida; sem #168 a tela exibe estado honesto e "Adicionar conta" desabilitado.

- [ ] T046 [P] [US6] Teste (RED) puro das derivações do grid em `tests/modules/financial/client/reconciliation-accounts/accounts-derivations.test.ts` (busca por banco/agência/conta; filtro status; ordenação pendências/saldo/nome/atualização; estado vazio honesto quando a porta devolve "indisponível").
- [ ] T047 [US6] Implementar `reconciliation-accounts.view-model.ts` + `reconciliation-accounts.query.ts` (consome a porta `listAccounts` = costura #168) e os bindings de filtro/ordenação, até T046 passar.
- [ ] T048 [US6] Implementar a TELA 1: `page/reconciliation-accounts.page.tsx` (+ `.css.ts`) com topbar (saldo consolidado/contagens), filter-bar (busca + chips Todas/Com pendências/Em dia/Encerradas + Ordenar) e o grid de contas (bank-mark, última atualização, saldo, pill de conciliação, seta) e footer. Estado **chrome honesto** (sem dados fabricados) até #168. Fidelidade ao mock (Figma node 8:6).
- [ ] T049 [US6] Implementar o modal **Adicionar conta bancária** em `components/add-account-modal.component.tsx` (+ `.css.ts`): seletor de banco buscável, tipo, agência, conta-DV, apelido, saldo de abertura — **desabilitado/anunciado** até #168 (costura `createAccount` pronta).
- [ ] T050 [US6] Ligar a navegação grid→workspace (clicar conta ativa → `/financeiro/conciliacao/$accountId`; encerrada não abre, com aviso) e substituir o seletor temporário (seed) pelo grid quando #168 entregar (mesma porta).
- [ ] T051 [US6] Teste (RED→GREEN) DOM em `tests/modules/financial/client/reconciliation-accounts/accounts-page.spec.tsx` (filtros/ordenação respondem; conta encerrada não abre; sem #168 mostra estado honesto e Adicionar desabilitado).

**Checkpoint**: porta de entrada do módulo pronta (fiel + honesta).

---

## Phase 9: User Story 7 — Fechar período + exportar (Priority: P3)

**Goal**: fechar período (bloqueado com pendências); **Exportar** OFX/CSV é chrome até #173.

**Independent Test**: tudo tratado → fechar → "fechado"; com pendências → bloqueado; Exportar
desabilitado/anunciado.

- [x] T052 [US7] Criar `src/modules/financial/server/adapters/server-fns/close-reconciliation-period.service.fn.ts` (input `{debitAccountRef, periodStart, periodEnd}`; mapeia 422 has-pending/400 invalid-range); schema/mapper + composition.
- [x] T053 [US7] Implementar `close-period.binding.ts` (invalida progresso/contagens) e o botão **Fechar período** na bottombar (`components/bottombar.component.tsx`), com aviso quando há pendências.
- [x] T054 [US7] Criar `src/modules/financial/client/data/reconciliation.gateway.ts` (download de texto OFX/CSV) e o **Exportar** na bottombar **desabilitado/anunciado** (#173, costura `export` pronta) — sem inventar `periodId`.
- [x] T055 [US7] Teste (RED→GREEN) DOM em `tests/modules/financial/client/reconciliation-workspace/bottombar.spec.tsx` (fechar com pendências bloqueia; sem pendências fecha; Exportar desabilitado com aviso #173).

**Checkpoint**: fechamento do ciclo funcionando; exportação preparada (chrome).

---

## Phase 10: User Story 8 — Aba Extrato + filtro de período (Priority: P3)

**Goal**: aba Extrato com visão completa (entradas/saídas/saldo por dia) e filtros; período compartilhado
com a Conciliação.

**Independent Test**: aba Extrato + filtro Pendentes + período → linhas e totais corretos.

- [x] T056 [P] [US8] Teste (RED) puro dos filtros/totais do extrato em `tests/modules/financial/client/reconciliation-workspace/statement-derivations.test.ts` (filtros todos/entradas/saídas/conciliados/pendentes; período client-side; totais).
- [x] T057 [US8] Implementar as derivações de extrato na view-model + `components/statement-grid.component.tsx` (+ `.css.ts`) e o `components/period-filter.component.tsx` compartilhado entre as abas, até T056 passar.
- [x] T058 [US8] Teste (RED→GREEN) DOM em `tests/modules/financial/client/reconciliation-workspace/statement-grid.spec.tsx` (filtros + período refletem na lista e nos totais).

**Checkpoint**: conferência completa do extrato disponível.

---

## Phase 11: Polish & Cross-Cutting

- [ ] T059 [P] Revisar a cadeia de erro fim-a-fim de todas as server fns (todas as `kind` do contrato cobertas, `switch` exaustivo, mensagens PT-BR sem vazar detalhe interno) — FR-017.
- [ ] T060 [P] Auditoria tokens-only nas duas telas (sem hex/rgb/px crus; `vars.*`); confirmar fontes/escala contra o mock e o Figma (8:6/8:7) — FR-018/SC-005.
- [ ] T061 [P] Acessibilidade dos estados chrome: `aria-disabled` + tooltip explicando a dependência (#168/#172/#173/#145) em todos os pontos bloqueados — SC-006.
- [ ] T062 Verificar **não-regressão** em Contas a Pagar (rodar a suíte existente) e revisar invalidations de Query para não afetar telas vizinhas.
- [ ] T063 Gerar baseline visual Playwright das duas telas (`e2e/visual/*.e2e.ts`) e rodar `pnpm test:visual` com a stack de pé (commitar os `.png -linux` só após revisão humana do diff).
- [ ] T064 `pnpm verify` + `pnpm test:dom` finais verdes; atualizar `public-api/index.ts` com os exports definitivos; abrir PR → **develop**.

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2)** bloqueiam tudo.
- **US1 (P1)** e **US2 (P1)**: o MVP. US1 é testável com extrato presente; US2 alimenta US1 — entregar
  as duas juntas para o caminho feliz. Ambas dependem só de Foundational.
- **US3, US4, US5 (P2)**: dependem de Foundational + US1 (reuso de seleção/transações). Independentes
  entre si.
- **US6 (P3)**: independente das demais (TELA 1); substitui o seletor seed ao ligar #168.
- **US7, US8 (P3)**: dependem de Foundational + dados de transações (US1/US2). Independentes entre si.
- **Polish** por último.

## Parallel Opportunities

- Setup: T002/T003/T004 em paralelo.
- Foundational: T006 e T008 (testes) em paralelo; T011 em paralelo com T010.
- US1: server fns T019/T020/T021 em paralelo (arquivos distintos); testes T017 antes dos mappers.
- Entre histórias após o MVP: US3, US4, US5 podem ser tocadas por devs distintos; US6 totalmente isolada.
- Polish: T059/T060/T061 em paralelo.

## Implementation Strategy

1. **MVP** = Setup + Foundational + **US1 + US2** (importar → conciliar por sugestão). Entrega o maior
   valor com o caminho feliz fechado.
2. **Incremento 2** = US3 + US4 + US5 (cobre N:1/parcial, manual/lote, desfazer) — "zerar" o extrato.
3. **Incremento 3** = US6 (grid, liga #168) + US7 (fechar/exportar) + US8 (extrato).
4. Chrome honesto desde o início: portas/gateways/server-fns "costura" já existem; ligar é trocar o
   adapter quando #168/#172/#173/#145 entregarem.
