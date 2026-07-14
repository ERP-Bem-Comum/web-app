# Implementation Plan: Enriquecer o match card via `payables:batch` (#357)

**Branch**: `069-payables-batch-match-card` | **Date**: 2026-07-14 | **Spec**: ./spec.md

**Input**: Feature specification from `specs/069-payables-batch-match-card/spec.md`

## Summary

De-interinar o LOOKUP do match card (#172 → #357): trocar o join caro (todas as páginas de `/payable-titles`

- todos os `/partners`) por uma chamada **targeted** ao `POST /payables:batch` (só os `payableId` dos itens),
  que resolve documentNumber/supplierName/dueDate em 1 hop com `supplierName` autoritativo do `fin_supplier_view`.
  Em paralelo, surfar por linha no N:1 o favorecido/órgão + documento (o client hoje descarta esse dado). O
  `retentionType` (ÓRGÃO do imposto retido) **não** vem no batch → preservado por um mapa mínimo de títulos,
  buscado **só quando pode haver imposto retido** (gate), evitando o agregador de parceiros por completo.

## Technical Context

**Language/Version**: TypeScript estrito (`erasableSyntaxOnly`) · Node 22
**Meta-framework**: `@tanstack/react-start` (BFF + SSR) · `@tanstack/react-router`
**Server-state**: TanStack Query · **Validação**: Zod 4 (na borda) · **UI**: React 19
**Design System**: vanilla-extract, tokens-only (`recon.*`) — ADR-0007
**Testes**: `node:test` (mapper + enrichment + view-model) + Vitest/jsdom (modal)
**Project Type**: web app (front + BFF unificado, módulo `financial`)
**Constraints**: token server-only; erros como valores; best-effort no enriquecimento (nunca derruba o modal)
**Scale/Scope**: 1 endpoint novo consumido; 1 modal; 0 server functions novas

## Constitution Check

| Princípio                            | Aderência | Nota                                                                              |
| ------------------------------------ | --------- | --------------------------------------------------------------------------------- |
| I. BFF-Orchestrated Boundary         | ✓         | batch chamado no adapter server; browser só vê a fn completa                      |
| II. Errors Are Values                | ✓         | `Result`; batch best-effort → mapa vazio; sem `throw` fora da borda               |
| III. Client×Server Modular           | ✓         | tudo em `financial`; sem cruzar boundary; interino mantido p/ outros consumidores |
| IV. Illegal States Unrepresentable   | ✓         | schema tolerante + mapper puro; união já existente                                |
| V. Server-State ≠ UI-State           | ✓         | lookup via Query; modal só apresenta                                              |
| VI. Validation at the Boundary       | ✓         | Zod no response do batch (borda anti-corrupção)                                   |
| VII. Strict TS                       | ✓         | sem enum/namespace; `Readonly<>`, `as const`                                      |
| VIII. Minimal Dependencies           | ✓         | nada novo                                                                         |
| IX. pnpm Only                        | ✓         | —                                                                                 |
| X. Spec-Driven                       | ✓         | esta spec + plano; #357 referencia ADR-0049 (core-api)                            |
| XI. Framework-Agnostic Client (MVVM) | ✓         | `MatchTitleLine`/`buildMatchTitles` puros; modal burro                            |
| XII. Reactive Flow via Event Bus     | n/a       | sem eventos                                                                       |

## Decisão-chave — preservar o ÓRGÃO (retentionType) sem regressão

O `payables:batch` (ADR-0049) **não** devolve `retentionType`. O modal usa `retentionType` para trocar o
favorecido pelo ÓRGÃO arrecadador (ISS→SEFIN, federais→Receita) em imposto retido — há teste cobrindo. O
`documentType` do batch é insuficiente: um título retido tem `documentType='Imposto'`, que colapsa ISS×federal.

**Escolha**: **merge do batch (documentNumber/supplierName/dueDate) + um mapa mínimo de `retentionType` por
`payableId`** lido do `/payable-titles`. Para não voltar a varrer sempre os títulos, o mapa mínimo é buscado
**só quando pode haver imposto retido** — gate por `documentType` do batch (marcadores `IMPOSTO`/`ISS`/`IRRF`/
`INSS`/`CSRF`) **ou** quando algum `payableId` do lookup veio em `missing` (docType desconhecido → conservador).
No caminho comum (sem retido, todos resolvidos), o lookup é **1 hop** e o agregador de parceiros nunca é tocado.

**Trade-off aceito**: quando há imposto retido no match, ainda scaneamos as páginas de `/payable-titles` (só
para `retentionType`) — porém sem o fetch de parceiros. **Follow-up de backend**: incluir `retentionType` no
`PayableBatchItem` → aí o mapa mínimo some e o lookup vira 1 hop sempre.

**`supplierName` não-fornecedor**: o batch resolve fornecedor via `fin_supplier_view`. O interino resolvia
qualquer tipo de parceiro (agregador dos 4). Se um título apontar para não-fornecedor, degrada para "—"
(follow-up), **sem regressão silenciosa** (documentado).

## Server Functions & Contratos do BFF

Nenhuma server fn nova. Alteração interna ao adapter `core-api-reconciliation.ts`:

| Ponto                                           | Antes (#172)                                                                  | Depois (#357)                                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `getTransactionReconciliation` (enriquecimento) | `buildEnrichmentMaps` (títulos+parceiros) + `enrichTransactionReconciliation` | `resolvePayablesBatch(ids)` (1 hop) + mapa mínimo de `retentionType` gated + `enrichReconciliationItemsFromBatch` |

Contrato consumido — `POST /api/v2/financial/payables:batch` (ADR-0049):

- Input: `{ refs: string[] }` (uuid, 1..200).
- 200: `{ items: PayableBatchItem[], missing: string[] }`.
- `PayableBatchItem`: `{ ref, documentId, documentNumber, documentType, valueCents, dueDate, status,
paymentMethod, supplierRef, supplierName, supplierDocument }` — **sem `retentionType`**.

Cadeia de erro: batch best-effort → falha vira mapa vazio → campos null → "—" no modal (nunca `ReconciliationError`).

## Integração core-api

| Capacidade                                 | Prontidão            | Estratégia                                                             |
| ------------------------------------------ | -------------------- | ---------------------------------------------------------------------- |
| `payables:batch` (doc/supplier/due por id) | 🟢 (dev, ADR-0049)   | real, 1 hop targeted                                                   |
| `retentionType` por id                     | 🔴 (não no contrato) | mapa mínimo do `/payable-titles`, gated; follow-up p/ incluir no batch |

## Design System Impact

- Reusa `mmSide`, `mmSideRow`, `mmSideK`, `mmSideV`. Adiciona 2 estilos token-only: `mmMultiLine`
  (agrupa a linha do título) e `mmMultiDoc` (nº do documento, secundário). Sem hex/px cru.

## Data Model (client × server)

- **server/domain**: `TransactionReconciliationItem` inalterado (já tem os campos).
- **client**: `MatchTitleLine` ganha `name`, `nameTag`, `documento` (além de `valueBRL`).

## Plano de Testes (TDD)

- **Puro (`node:test`)**:
  - `reconciliation-mappers.test.ts`: `payablesBatchToModel` — parse OK, `missing`, tolerância a drift, dueDate date-only.
  - `reconciliation-enrichment.test.ts`: `enrichReconciliationItemsFromBatch` (merge + preserva retentionType),
    `isRetentionDocType` (gate), `buildRetentionMap` best-effort (falha → mapa vazio).
  - `workspace-view-model.test.ts`: `buildMatchTitles` — lines com name/nameTag/documento; imposto retido → nameTag do órgão.
- **DOM (Vitest/jsdom)**: `match-details-modal.spec.tsx` — N:1 mostra favorecido + documento por linha;
  N:1 imposto retido mostra o ÓRGÃO (não o fornecedor do pai); caso 1:1 imposto retido **NÃO regride**.

## Complexity Tracking

| Violação                                                       | Por que necessária                                               | Alternativa rejeitada porque                                                              |
| -------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mapa mínimo de `retentionType` ainda scaneia `/payable-titles` | batch não expõe `retentionType`; preservar o ÓRGÃO é obrigatório | usar só `documentType` do batch regride ISS×federal; N hops por id anula o ganho do batch |

</content>
