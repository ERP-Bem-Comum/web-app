# Implementation Plan: Grid Contas a Pagar resolve fornecedor pelo read-model

**Branch**: `integration/financial-supplier-readmodel-029` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

## Summary

Adicionar `supplierName` + `supplierDocument` (CNPJ) ao DTO da lista de Contas a Pagar (borda → io → model → mapper) e fazer o `toRow` ler esses campos direto, parando de usar o `partners-map` **na lista**. O drawer de detalhe mantém o `partners-map` (detalhe não enriquecido, #95). `supplierKind` na lista passa a default `'supplier'` (avatar Fornecedor) — o read-model só projeta Fornecedor e o DTO não traz kind.

## Technical Context

- TanStack Start + React 19 + Zod 4. Sem deps novas. Somente frontend (BFF + client).
- Resiliência: `supplierName`/`supplierDocument` como `z.string().trim().nullable().catch(null)` (tolerante; nulos por consistência eventual).
- Testing: node:test do `listToModel` (mapper) e do `toRow`/`deriveListState` (view-model) — aditivo; gates verdes.

## Constitution Check

PASS. III (borda valida o campo), V (Zod na borda), XI (view-model puro; views burras), II/IV/VII inalterados. Reduz acoplamento Financeiro↔Parceiros (melhora I).

## Project Structure (arquivos)

```text
src/modules/financial/server/adapters/core-api/financial.schema.ts   # +supplierName/supplierDocument (CoreApiDocumentSummarySchema)
src/modules/financial/server/adapters/core-api/financial.mappers.ts  # listToModel mapeia os 2 campos
src/modules/financial/server/domain/document.io.ts                   # DocumentSummary +2 campos
src/modules/financial/client/data/model/document.model.ts            # DocumentSummary (client) +2 campos
src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.view-model.ts
    # toRow: supplier=it.supplierName ?? DASH; supplierDoc=maskCnpj(it.supplierDocument); supplierKind='supplier';
    # remove os params resolveSupplier/resolveKind/resolveDoc de toRow e deriveListState (mantém resolveContract)
src/modules/financial/client/contas-a-pagar-list/contas-a-pagar.binding.ts
    # remove useQuery(partnersMap) + resolveSupplier/resolveKind/resolveDoc (mantém contracts-map/resolveContract)
tests/modules/financial/.../contas-a-pagar.view-model.test.ts        # aditivo: toRow lê supplierName/Document
```

NÃO tocar: `partners-map.binding.ts`, `document-detail.binding.ts` (drawer mantém o workaround até #95).
Tipos `ResolveSupplier`/`ResolveSupplierDoc` permanecem (usados pelo detail). `ResolveSupplierKind` removível se ficar sem consumidores (verificar no implement).

## Complexity Tracking

Sem violações. Divergência vs. spec original (remoção total do workaround) já corrigida na própria spec: remoção **só na lista**; drawer mantém (#95).

## Estimativa de Pipeline (W0 size)

- **Tamanho**: **M** — campo novo no DTO em 4 camadas + refactor do toRow/binding + remoção de uso na lista.
- **Plano de testes (TDD-leve)**: estender o teste do view-model para o `toRow` consumir `supplierName`/`supplierDocument` (com nulos → DASH/null); `listToModel` mapeia os campos; suítes existentes verdes.
