# Feature Specification: Enriquecer o match card da Conciliação via `payables:batch` (#357)

**Feature Branch**: `069-payables-batch-match-card`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Ligar `POST /api/v2/financial/payables:batch` (ADR-0049 core-api) para enriquecer o
match card do modal 'Detalhes da conciliação', de-interinando o LOOKUP de conciliação (#172)."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Favorecido e documento por título no N:1 (Priority: P1)

Ao abrir "Detalhes da conciliação" de um pagamento conciliado com **vários títulos** (1 saída → N títulos),
o usuário vê, para **cada** título, o **favorecido** (ou o ÓRGÃO arrecadador em imposto retido) e o **nº do
documento**, além do valor conciliado — não apenas "Título 1: R$ X".

**Why this priority**: É o ganho visível pedido pela P.O. Hoje o N:1 descarta o dado enriquecido (que já
existe nos itens) e mostra só o valor, deixando o usuário sem saber a quais títulos o pagamento se refere.

**Independent Test**: Abrir um match N:1 na Conciliação → o lado "Títulos no sistema (N)" lista favorecido +
documento + valor por linha; total e diferença permanecem.

**Acceptance Scenarios**:

1. **Given** um pagamento conciliado com 3 títulos de fornecedores distintos, **When** abro o modal de
   detalhes, **Then** cada linha exibe o favorecido, o nº do documento e o valor conciliado.
2. **Given** um dos títulos do N:1 é imposto retido (ISS), **When** abro o modal, **Then** a linha desse
   título mostra o ÓRGÃO arrecadador (SEFIN), não o fornecedor do documento-pai.
3. **Given** o BFF não resolveu um título (dado indisponível), **When** abro o modal, **Then** a linha
   degrada graciosamente (favorecido/documento em "—") sem quebrar o modal.

### User Story 2 - Lookup do match card em 1 hop targeted (Priority: P2)

O enriquecimento do LOOKUP do match card passa a resolver documento/favorecido/vencimento por uma chamada
**targeted** ao `payables:batch` (só os ids dos itens), no lugar do join caro que varre TODAS as páginas de
`/payable-titles` + TODOS os `/partners`.

**Why this priority**: Reduz o custo do lookup e usa o `supplierName` autoritativo do `fin_supplier_view`,
sem mudar o que o usuário vê (mesmo card). É de-interinação técnica (#172 → #357), transparente para a UI.

**Independent Test**: Abrir o modal de um match 1:1 → favorecido/documento/vencimento aparecem iguais aos de
hoje; a resolução vem do batch (verificável nos testes de mapper/enrichment).

**Acceptance Scenarios**:

1. **Given** um match 1:1, **When** abro o modal, **Then** favorecido/documento/vencimento aparecem como
   hoje, resolvidos pelo batch.
2. **Given** o batch falha (rede/5xx), **When** abro o modal, **Then** os campos enriquecidos degradam para
   "—" e o modal continua funcional (nunca vira erro).

### Edge Cases

- Item do lookup ausente no batch (`missing`): os campos daquele título degradam para "—".
- Imposto retido: o `payables:batch` **não** devolve `retentionType` — o ÓRGÃO precisa ser preservado por
  outra fonte (mínima), sob pena de regressão do headline.
- Lançamento manual (`items` vazio): sem título a resolver → nenhuma chamada extra.
- Favorecido não-fornecedor: o `supplierName` do batch vem do `fin_supplier_view` (fornecedores) — se um
  título apontar para parceiro não-fornecedor, degrada para "—" (follow-up de backend, sem regressão silenciosa).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O modal DEVE exibir, por linha do N:1, favorecido (ou órgão em imposto retido) + nº do
  documento + valor conciliado.
- **FR-002**: O headline de cada título DEVE ser o ÓRGÃO arrecadador quando o título é imposto retido
  (ISS→SEFIN; IRRF/INSS/CSRF→Receita Federal), preservando a regra do 1:1.
- **FR-003**: O BFF DEVE resolver documento/favorecido/vencimento do LOOKUP via `POST /payables:batch`
  passando só os `payableId` dos itens, com input validado (Zod) e resposta validada na borda.
- **FR-004**: O enriquecimento DEVE ser best-effort: falha do batch → campos null (degrada para "—"), nunca
  um erro que derrube o modal.
- **FR-005**: O sistema NÃO DEVE regredir o ÓRGÃO do imposto retido ao trocar o interino pelo batch.

### Key Entities

- **PayableBatchItem**: título resolvido por id (ref, documentNumber, documentType, valueCents, dueDate,
  status, supplierRef, supplierName, supplierDocument). Sem `retentionType`.
- **TransactionReconciliationItem**: item do lookup (payableId, reconciledValueCents, documentNumber,
  supplierName, dueDate, retentionType) — enriquecido no BFF.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% das linhas do N:1 mostram favorecido + documento quando o dado existe; degradam para "—"
  quando não.
- **SC-002**: O LOOKUP do match card deixa de disparar o fetch do agregador de parceiros (4 tipos) no caminho
  comum (sem imposto retido).
- **SC-003**: Zero regressão no headline do imposto retido (teste de modal cobre o ÓRGÃO).

## Impacto Arquitetural (web-app / BFF)

- **Módulo(s) vertical(is) afetado(s)**: estende `financial` (client `reconciliation-workspace` + server
  `adapters/core-api`). Sem módulo novo.
- **Server functions novas/alteradas**: nenhuma nova; `getTransactionReconciliation` (porta inalterada) muda
  a estratégia de enriquecimento internamente no adapter.
- **Integração core-api**: novo consumo `POST /api/v2/financial/payables:batch` (ADR-0049, já em dev).
- **Novos agregados / VOs**: nenhum; novo schema Zod tolerante + mapper puro do batch.
- **Eventos no client**: nenhum.
- **Design System**: só composição + 2 estilos token-only para a linha do N:1; sem hex/px cru.
- **Possíveis violações**: nenhuma prevista (view burra, view-model puro, Zod na borda, erros como valores).

## Assumptions

- O `payables:batch` cobre os favorecidos do match card via `fin_supplier_view`; casos não-fornecedor
  degradam para "—" (follow-up, não regressão).
- O interino (`reconciliation-enrichment.ts`/`.source.ts`) permanece para paid-payables e suggestions.

## Out of Scope

- Enriquecer paid-payables e suggestions (seguem no interino #172).
- Categoria do título (category_ref write-only no core-api) — segue "—".
- Adicionar `retentionType` ao contrato do batch (follow-up de backend).
  </content>
  </invoke>
