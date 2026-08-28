# 110 — Plano de implementação (FRONT)

> Escala **M**. A passada de BACKEND da M2 é separada e ainda não está na `dev` do core-api.

## Camadas tocadas (dependência aponta para dentro)

| Camada            | Arquivo                                          | O quê                                                                                                                                            |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| view-model (PURO) | `reconciliation-workspace.view-model.ts`         | `applyTaxonomyChange`, `isTaxonomyPathValid`, `hasTaxonomySelection`, `isReclassifiableTitle`, `hasReclassifiableSelection`, `taxonomyToPayload` |
| binding           | **novo** `taxonomy-cascade.binding.ts`           | queries (programas/planos/árvore) + opções plano-first + estado dos 5 refs                                                                       |
| binding           | `manual-entry.binding.ts`                        | passa a CONSUMIR a cascata (deixa de ter a sua)                                                                                                  |
| binding           | `reconciliation-workspace.binding.ts`            | `reclassify` (canEdit/editing/cascade/start/cancel)                                                                                              |
| binding           | `reconcile.binding.ts`                           | `reconcileOne(tx, payable, reclassification?)`                                                                                                   |
| binding           | `search-create.binding.ts`                       | `reclassify` + anexa os refs no confirm                                                                                                          |
| ui                | **novo** `taxonomy-cascade-fields.component.tsx` | os 5 selects (view burra)                                                                                                                        |
| ui                | `suggestion-pane.component.tsx`                  | "Editar" no bloco CATEGORIZAÇÃO + gate do Conciliar                                                                                              |
| ui                | `search-create-pane.component.tsx`               | "Editar" ao lado de "+ Lançamento Manual" + painel                                                                                               |
| ui                | `reconciliation-workspace.page.tsx`              | monta o payload no clique de Conciliar                                                                                                           |
| ui                | `reconciliation-workspace.css.ts`                | grade dos selects, botão, painel, estado barrado                                                                                                 |
| data              | `data/model/reconciliation.model.ts`             | `ReclassificationInput` + campo em `CreateReconciliationInput`                                                                                   |
| server            | `server/domain/reconciliation.io.ts`             | mesmo contrato no domínio do BFF                                                                                                                 |
| server            | `adapters/reconciliation.io-schemas.ts`          | Zod (UUID) na borda — §IX                                                                                                                        |
| server            | `adapters/core-api/core-api-reconciliation.ts`   | anexa ao POST — **ponto de ligação**                                                                                                             |
| i18n              | `catalog.pt-BR.ts`                               | rótulos do editar/cancelar/selecionar + os 2 avisos                                                                                              |

## Ordem seguida

1. Núcleo PURO + testes (regras antes de UI — as RN são testáveis sem React).
2. Cascata compartilhada e o componente dos selects.
3. Contrato ponta a ponta, com o ponto de ligação comentado.
4. Os dois pontos de entrada (Sugestão, Buscar/Criar vários).
5. `manual-entry` migrado para a cascata compartilhada (sem duplicar).
6. Testes de DOM dos dois pontos de entrada.

## Gates

`pnpm verify` (typecheck + lint 0 erros + 1861) e `pnpm test:dom` (725) — verdes.

## Riscos assumidos

- **O efeito da reclassificação depende do backend.** Sem ele, o campo sobe e é ignorado. Conciliar não
  regride.
- **Validade do caminho é por construção no front.** Ref desativado entre leitura e confirm (M2-10) é
  recusa do backend.
- **A cascata extraída alcança a "Nova transação".** Mesma regra, mais a guarda de no-op que faltava lá.
