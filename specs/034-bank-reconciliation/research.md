# Phase 0 — Research: Conciliação Bancária

Sem `NEEDS CLARIFICATION` pendentes (a `/speckit-clarify` resolveu os 3 pontos de maior impacto, ver
`spec.md` › Clarifications). Esta fase consolida as decisões técnicas que governam o `/speckit-plan` e
o `/speckit-tasks`.

---

## D1 — Onde mora o módulo: submódulo do Financeiro (não top-level)

- **Decisão**: criar `bank-reconciliation` **dentro** de `src/modules/financial/` (server estendido +
  duas pastas-feature no client), reusando `data/money.ts`, `financial.repository`, os erros do
  Financeiro e o `core-api-financial`. Único `public-api` do Financeiro.
- **Rationale**: Conciliação é capability do BC Financeiro e consome `/api/v2/financial`. Um módulo
  top-level duplicaria money/erros/cliente e criaria fronteira artificial.
- **Alternativas**: módulo `reconciliation/` próprio (rejeitado: duplicação + import cross-módulo
  desnecessário); colar tudo em `contas-a-pagar-list` (rejeitado: viola coesão por feature).

## D2 — Conta-cedente sem endpoint (#168): seletor temporário do seed

- **Decisão**: a TELA 1 (grid) é **chrome honesto** (UI fiel, estado anunciado, "Adicionar conta"
  desabilitado) até #168. A TELA 2 obtém a conta via **seletor temporário que lê uma conta-cedente já
  existente no seed do backend**, destravando import/conciliação ponta-a-ponta. A costura
  (porta `listAccounts/getAccount` no repository + server-fn) já fica criada, devolvendo "indisponível"
  até #168 — trocar o adapter liga o fluxo real.
- **Rationale**: entrega US1–US5 (o núcleo) já, sem fabricar dados de conta; o grid liga depois sem
  refactor de fronteira. Espelha o padrão OCR ("adapter devolve indisponível até #62").
- **Alternativas**: mockar contas (rejeitado: viola "sem dados que enganem", SC-006); bloquear o
  módulo inteiro até #168 (rejeitado: trava o maior valor por uma porta de entrada).

## D3 — Exibição de título = mínimo até #172

- **Decisão**: match card e grid de títulos mostram só o que a API dá hoje
  (`documentId`/`valueCents`/`dueDate`/`paymentMethod`). Nome do fornecedor e nº de documento amigável
  ficam em slots preparados, preenchidos quando #172 enriquecer a resposta.
- **Rationale**: não inventar/resolver client-side (acoplaria a outra listagem e poderia mentir).
- **Alternativas**: cruzar com outra query de fornecedores no client (rejeitado: N+1, risco de dado
  errado, fora do contrato).

## D4 — Exportar = chrome até #173; Fechar período funciona

- **Decisão**: `POST /reconciliation-periods/close` é ligado de verdade. **Exportar** (que exige
  `periodId` e não há endpoint para listá-los fora do fechamento) fica desabilitado/anunciado até #173.
  Gateway de download já fica pronto.
- **Rationale**: o `periodId` só existe no retorno do fechamento; sem listagem não há como reabrir para
  exportar de forma honesta.
- **Alternativas**: guardar o `periodId` do último fechamento em estado de UI (rejeitado: efêmero,
  enganoso entre sessões); inventar endpoint (rejeitado: não criamos backend).

## D5 — Import é JSON com o arquivo como texto (não multipart)

- **Decisão**: o front lê o arquivo (`File.text()`) e envia
  `{ debitAccountRef, format:'OFX'|'CSV', content, fileName? }` à server fn, que repassa ao core-api.
  **PDF/OCR fica de fora** (#145) — opção desabilitada/anunciada.
- **Rationale**: o contrato real do PR #152 é JSON com `content:string`. Nativo (`File.text()`),
  sem dep nova.
- **Alternativas**: upload multipart (rejeitado: não é o contrato); parsear OFX/CSV no front
  (rejeitado: o core-api parseia e faz dedup por Fitid).

## D6 — Erros como valores + tags i18n (cadeia fim-a-fim)

- **Decisão**: mapear os erros do contrato (`unsupported-format`, `empty-content`,
  `malformed-statement`, `period-closed`, `empty-statement`, `reconciliation-not-balanced`,
  `transaction-already-reconciled`, `account-closed`, `payable-not-found`, `title-not-paid`,
  `empty-reconciliation`, `reconciliation-already-undone`, `period-has-pending-transactions`,
  `invalid-period-range`, `unsupported-export-format`, `reconciliation-period-not-found`) para
  `AppError.kind` e daí para **tags i18n PT-BR**, via o `mapToAppError`/`financial-error-tag` já
  existentes (estendê-los). A UI faz `switch` exaustivo, nunca olha status HTTP.
- **Rationale**: princípios II e V; reusa o helper `financial-error-tag.ts`.
- **Alternativas**: throw/try-catch na UI (proibido pela constituição).

## D7 — Estado: server-state no Query; UI-state em reducer/binding

- **Decisão**: transações, sugestões, payables Pagos via TanStack Query (queries por conta/extrato).
  Mutations (importar, conciliar, rejeitar, desfazer, manual, lote, fechar) invalidam as queries
  afetadas (lista de transações + progresso + contagens). Filtros (Pendentes/Conciliadas/Todas,
  entradas/saídas, período) e seleção de transação/títulos são **UI-state** (reducer no
  binding/controller), pois a listagem do backend não filtra server-side.
- **Rationale**: princípio XI; os filtros são client-side por contrato (sem filtro server-side).
- **Alternativas**: derivar tudo de Query keys por filtro (rejeitado: backend não suporta; geraria
  refetch desnecessário).

## D8 — Fidelidade de UI: mocks como fonte + tokens do app (+ Figma p/ valores exatos)

- **Decisão**: replicar `grid_conciliacao.{html,css,js}` e `conciliacao_bancaria.{html,css,js}` 1:1 em
  estrutura/estados, **traduzindo** os literais do mock (teal `rgb(41,140,171)`, Inter/Fraunces/Mono,
  escalas paper/ink) para `vars.*` do design system (tokens-only, X). Durante o implement, usar o
  **Figma MCP** (fileKey `ypWvBc8kzHJuZzejsGQDUQ`, nodes 8:6 e 8:7) via `get_design_context` para
  confirmar espaçamentos/tokens exatos quando o mock divergir.
- **Rationale**: FR-018/SC-005 exigem alta fidelidade; a constituição proíbe cor/px crus em `ui/`.
- **Alternativas**: copiar o CSS do mock direto (rejeitado: viola tokens-only e o lint pega).

## D9 — Discriminated unions do domínio (estados ilegais irrepresentáveis)

- **Decisão**: modelar como unions de literais + `switch` exaustivo:
  `movement: 'Debit'|'Credit'`; `reconciliationStatus: 'Pending'|'Reconciled'|'ManualEntry'`;
  `reconciliation type: 'Individual'|'Multiple'|'Partial'`; `difference treatment:
'Interest'|'Penalty'|'Discount'|'Fee'|'Partial'`; `manual-entry type:
'Payment'|'Receipt'|'Transfer'|'FeePenaltyInterest'|'Investment'|'Redemption'`; `suggestion band:
'alta'|'media'`. Transferência/Aplicação/Resgate exigem `destinationAccount` + confirmação consciente
  (modelado como estado que bloqueia submit até confirmado).
- **Rationale**: princípio IV/VI; `as const`, sem `enum`.

## D10 — Regra de balanceamento (pura, testável primeiro)

- **Decisão**: `somatório(valor dos títulos selecionados) + difference.valueCents === |valor da
transação|` é uma **função pura** na application/view-model que habilita/bloqueia o botão Conciliar e
  decide o `type` (Individual/Multiple/Partial). O backend revalida (422 `reconciliation-not-balanced`),
  mas a UI nunca deixa enviar desbalanceado (SC-004).
- **Rationale**: TDD — é o primeiro teste RED; centavos (inteiros) evitam erro de ponto flutuante.
