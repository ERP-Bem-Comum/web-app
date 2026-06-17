---
description: 'Task list — contagem de contratos nos grids de parceiros'
---

# Tasks: Contagem de contratos nos grids de parceiros

**Input**: specs/028-partners-contract-count/ (spec, plan)

**Tests**: ajuste aditivo de fixtures (se houver suíte de adapter comparando o objeto mapeado). Gates verdes.

## Phase 1: Borda (schema) + mapeamento (adapter) + model — por tipo

- [x] T001 [P] Supplier: `contractCount: z.int().nonnegative().catch(0)` em `supplier.schema.ts` (CoreApiSupplierItemSchema); `itemToModel` em `core-api-suppliers.ts` mapeia `contractCount`; `SupplierListItem` em `supplier.model.ts` ganha `contractCount: number`.
- [x] T002 [P] Financier: idem em `financier.schema.ts` / `core-api-financiers.ts` / `financier.model.ts` (`FinancierListItem`).
- [x] T003 [P] Act: idem em `act.schema.ts` / `core-api-acts.ts` / `act.model.ts` (`ActListItem`).
- [x] T004 [P] Collaborator: idem em `collaborator.schema.ts` / `core-api-collaborators.ts` / `collaborator.model.ts` (`CollaboratorListItem`).

## Phase 2: i18n

- [x] T005 Adicionar `partners.financiers.columns.contracts` e `partners.acts.columns.contracts` em `catalog.pt-BR.ts` (reusar texto 'Contratos/Aditivos' já usado em suppliers/collaborators).

## Phase 3: Coluna nos grids (views)

- [x] T006 [P] Collaborator: em `collaborator-list/page/collaborator-list.page.tsx`, trocar a `cell: () => '—'` da coluna `contracts` por `cell: (r) => String(r.contractCount)` (un-gate).
- [x] T007 [P] Supplier: adicionar coluna "Contratos" em `supplier-list/page/supplier-list.page.tsx` usando `partners.suppliers.columns.contracts` → `r.contractCount`.
- [x] T008 [P] Financier: adicionar coluna em `financier-list/page/financier-list.page.tsx` (`partners.financiers.columns.contracts`).
- [x] T009 [P] Act: adicionar coluna em `act-list/page/act-list.page.tsx` (`partners.acts.columns.contracts`).

## Phase 4: Gates + validação

- [x] T010 `pnpm typecheck` + `pnpm lint` (0 erros); ajustar fixtures de teste de partners de forma aditiva se algum comparar o objeto mapeado.
- [x] T011 `pnpm test` + `pnpm test:dom` verdes (zero regressão).
- [x] T012 Validação manual (stack local): abrir os 4 grids e conferir a coluna "Contratos" com números reais (0 para quem não tem). Atualizar Status da spec.

## Dependencies

- Phase 1 (model precisa do campo) antes da Phase 3 (coluna lê `r.contractCount`).
- Phase 2 (i18n) antes/junto da Phase 3 (header usa a tag).
- T001–T004 e T006–T009 são `[P]` (arquivos distintos por tipo).

## Notes

- `.catch(0)` evita quebra de fixtures sem o campo e atende o fallback "exibir 0".
- 1 feature por PR → este PR cobre só a contagem; nada de outras features.
