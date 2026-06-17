---
description: 'Task list — grid Contas a Pagar resolve fornecedor pelo read-model'
---

# Tasks: Grid Contas a Pagar resolve fornecedor pelo read-model

**Input**: specs/029-financial-supplier-readmodel/ (spec, plan)

## Phase 1: Contrato (borda → io → model → mapper)

- [x] T001 `financial.schema.ts`: adicionar `supplierName: z.string().trim().nullable().catch(null)` e `supplierDocument: z.string().trim().nullable().catch(null)` ao `CoreApiDocumentSummarySchema`.
- [x] T002 `financial.mappers.ts` (`listToModel`): mapear `supplierName: s.supplierName` e `supplierDocument: s.supplierDocument` no item.
- [x] T003 `document.io.ts` (`DocumentSummary`): `supplierName: string | null` e `supplierDocument: string | null`.
- [x] T004 `document.model.ts` (client `DocumentSummary`): mesmos 2 campos.

## Phase 2: View-model + binding (consumir o DTO, parar de usar partners-map na lista)

- [x] T005 (RED) Estender `tests/.../contas-a-pagar.view-model.test.ts`: `toRow` usa `supplierName`→`supplier` (fallback DASH), `supplierDocument`→`supplierDoc` mascarado, `supplierKind='supplier'`; nulos degradam. Falha antes da impl.
- [x] T006 `contas-a-pagar.view-model.ts` `toRow`: `supplier = it.supplierName ?? DASH`; `supplierDoc = maskCnpj(it.supplierDocument)`; `supplierKind = 'supplier'`. Remover params `resolveSupplier`/`resolveKind`/`resolveDoc` de `toRow` e de `deriveListState` (manter `resolveContract`).
- [x] T007 `contas-a-pagar.binding.ts`: remover `useQuery(partnersMapQueryOptions)` e `resolveSupplier`/`resolveKind`/`resolveDoc`; manter `contracts-map`/`resolveContract`. Atualizar a chamada a `deriveListState`.
- [x] T008 Limpar tipos órfãos: se `ResolveSupplierKind` ficar sem consumidores, remover; manter `ResolveSupplier`/`ResolveSupplierDoc` (usados pelo `document-detail.binding`). Verificar por busca.

## Phase 3: Gates + validação

- [x] T009 `pnpm typecheck` + `pnpm lint` (0 erros). Ajustar fixtures de teste do financeiro de forma aditiva se algum comparar o objeto.
- [x] T010 `pnpm test` + `pnpm test:dom` verdes (zero regressão).
- [~] T011 BLOQUEADO: read-model fin_supplier_view vem all-null no core-api local (backfill #47 não rodou) → não dá p'ra validar o caminho feliz sem regressão. Ver decisão (hold vs hybrid).

## Dependencies

- Phase 1 antes da Phase 2 (toRow lê os campos novos do model).
- T005 (RED) antes de T006.

## Notes

- Drawer de detalhe (`document-detail.binding`) e `partners-map.binding.ts` **permanecem** (detalhe não enriquecido, #95).
- `maskCnpj` da view-model continua o existente (digit-based) nesta branch; a compat alfanumérica chega quando a 027 (CNPJ) mergear.
- 1 feature por PR; PR → develop após #35 mergear.
