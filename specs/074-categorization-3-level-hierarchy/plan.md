# Implementation Plan: Hierarquia 3 níveis na Categorização (Centro → Categoria → Subcategoria)

**Branch**: `feat/reports-real-endpoints` (trabalho em 074) | **Date**: 2026-07-14 | **Spec**: `./spec.md`

**Input**: `specs/074-categorization-3-level-hierarchy/spec.md`

## Summary

Passar `costCenterId` (#341) pela cadeia BFF→client, extrair as derivações da cascata para um helper
PURO compartilhado (`data/helpers/categorization-cascade.ts`), ligar a cascata + resets no Lançar
Documento (Subcategoria vira o ref real `subcategoryRef`, hoje chrome vazio) e **de-placeholderizar** a
Conciliação (mata o round-robin `TODO core-api#341`). O backend recebe a FOLHA em `categoryRef`.

## Technical Context

**Language/Version**: TypeScript estrito (`erasableSyntaxOnly`) · React 19
**Camadas**: server/adapters (schema+mapper) → server/domain (io) → client/data (model+helper) → client (view/controller/binding/page)
**Validação**: Zod 4 na borda do core-api (tolerante: `.nullable().catch(null)`)
**Testes**: `node:test` (derivações puras + regra da folha) + Vitest/jsdom (cascata na tela)
**Constraints**: um único fetch de referências (`referenceOptionsQuery`, `staleTime` 300s) serve os 3 selects
**Scale/Scope**: 4 arquivos de cadeia + 1 helper novo + 4 arquivos de UI + 2 arquivos de teste

## Decisão-chave: o que fazer quando NÃO há Centro selecionado

**Contexto que força a decisão** (verificado no core-api em `bfa854a2`, branch `dev`): o #341 entregou
**capacidade** (coluna `cost_center_id`, DTO, read), **não dado**. O seed
(`adapters/persistence/seed/reference-categories.ts`) tem 11 categorias — **todas sem `costCenterId` e
sem `parentId`**. O handbook do core-api (`07-categorization-taxonomy.md`) confirma: _"Seed real do
legado (portar a taxonomia via ACL — ADR-0048) = follow-up de **dado**"_.

Consequência: um filtro **estrito** (`c.costCenterId === centroSelecionado`), embora seja a leitura
literal do comentário do schema do core-api ("Front cascateia com costCenterId + parentId"), entregaria
hoje uma lista de Categoria **VAZIA para todo centro** — quebrando o lançamento em produção.

**Decisão** (regra tolerante, monotônica em relação ao dado futuro):

| Estado                  | Categoria mostra                                                    |
| ----------------------- | ------------------------------------------------------------------- |
| Nenhum Centro escolhido | **todas** as de topo (`parentId === null`)                          |
| Centro escolhido        | as de topo **daquele centro** ∪ as de topo **sem centro** (globais) |

**Por quê**:

1. **Não bloqueia**: o Centro é opcional no lançamento (`costCenterRef` é `trimToUndefined`); exigir o
   centro para liberar a Categoria seria regressão de fluxo (US2).
2. **Zero regressão hoje**: com o seed atual (tudo `null`), a Categoria segue listando as 11 — igual a
   hoje, porém já sem as subcategorias misturadas (que hoje também não existem).
3. **Semanticamente correta amanhã**: `costCenterId === null` = categoria **global** (vale para qualquer
   centro). As categorias de `group: 'ajuste'` (Ajuste de conciliação, Estorno) — usadas na Conciliação
   independentemente de centro — tendem a permanecer sem centro. À medida que o legado for portado, as
   categorias atribuídas passam a filtrar de verdade e o conjunto "global" encolhe **sem mudança de
   código**.

**Alternativas rejeitadas**:

- _Filtro estrito_: Categoria vazia hoje = feature quebrada no go-live.
- _Vazio sem centro_ (o que a Conciliação faz hoje): força o Centro como obrigatório de fato — regressão
  no Lançar Documento, onde ele é opcional.
- _Fallback "se o centro não tem nenhuma categoria, mostra todas"_: comportamento mágico e não-monotônico
  (a lista muda de regra conforme o dado) — mais difícil de explicar e de testar.

## Constitution Check

| Princípio                            | Aderência | Nota                                                                         |
| ------------------------------------ | --------- | ---------------------------------------------------------------------------- |
| I. BFF-Orchestrated Boundary         | ✓         | reusa `getReferences` (fan-out /categories + /cost-centers); nenhuma fn nova |
| II. Errors Are Values                | ✓         | cadeia inalterada (`Result`); schema tolerante não lança                     |
| III. Client×Server Modular           | ✓         | helper em `client/data/helpers` (client-data), consumido na mesma feature    |
| IV. Illegal States Unrepresentable   | ✓         | resets impedem folha órfã (subcategoria de outra categoria)                  |
| V. Server-State ≠ UI-State           | ✓         | refs = server-state (Query cacheada); seleção = UI-state (reducer)           |
| VI. Validation at the Boundary       | ✓         | `costCenterId` validado no schema do core-api, tolerante a drift             |
| VII. Strict TS 6→7                   | ✓         | sem enum/namespace; tipos `Readonly<>`                                       |
| VIII. Minimal Dependencies           | ✓         | zero dep nova                                                                |
| IX. pnpm Only                        | ✓         | —                                                                            |
| X. Spec-Driven                       | ✓         | feature 074 (spec+plan); sem ADR (implementa hierarquia já decidida)         |
| XI. Framework-Agnostic Client (MVVM) | ✓         | derivações puras (sem React) no helper; React só no binding; view burra      |
| XII. Event-Driven                    | ✓         | N/A                                                                          |

## Fases

### Fase 1 — Cadeia `costCenterId` (BFF → client)

| Arquivo                                              | Mudança                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `server/adapters/core-api/reconciliation.schema.ts`  | `costCenterId: z.string().trim().nullable().catch(null)` |
| `server/domain/reconciliation.io.ts`                 | `FinancialCategory.costCenterId: string \| null`         |
| `server/adapters/core-api/reconciliation.mappers.ts` | repassa `costCenterId`                                   |
| `client/data/model/reconciliation.model.ts`          | `FinancialCategory.costCenterId: string \| null`         |

### Fase 2 — Derivações puras compartilhadas

Novo `client/data/helpers/categorization-cascade.ts` (tipo `client-data` → importável pelos
view-models/bindings/`*.view.ts` da feature `financial`; sem React/tanstack):

- `topLevelCategories(refs)` — `parentId === null`
- `categoriesForCostCenter(refs, costCenterId)` — regra da tabela acima
- `subcategoriesOf(refs, categoryId)` — `parentId === categoryId`; `''` → `[]`
- `leafCategoryRef(categoryRef, subcategoryRef)` — a FOLHA (padrão que a Conciliação já usa)

`reconciliation-workspace.view-model.ts` re-exporta os 3 primeiros (mantém os call sites e o teste
existente) e **perde o round-robin**.

### Fase 3 — Lançar Documento (cascata + folha)

- `document-form.view.ts`: campo `subcategoria` (texto, chrome órfão) → **`subcategoryRef`** (uuid);
  `buildCreateInput`/`buildAdjustInput` enviam `leafCategoryRef(...)` em `categoryRef`.
- `document-form.controller.ts`: `setCategoryRef` limpa a subcategoria; `setCostCenterRef` limpa
  categoria + subcategoria; ação `setSubcategoryRef`.
- `category-options.binding.ts`: `useCategoryOptions(costCenterRef)` e `useSubcategoryOptions(categoryRef)`
  via `select` sobre o MESMO `referenceOptionsQuery`.
- `lancar-documento.page.tsx` + `document-form.component.tsx`: passa `subcategoriaOptions` reais e liga
  o `onSubcategory`; `locks` intactos.

### Fase 4 — Conciliação (de-placeholder)

`manual-entry.binding.ts` já chama `categoriesForCostCenter`/`subcategoriesOf` — passa a receber a
regra real via o re-export. Sem mudança de call site.

## Testes

**node:test** (`tests/modules/financial/client/data/categorization-cascade.test.ts`): topo; filtro por
centro (do centro ∪ globais); sem centro → todas as de topo; centro sem categorias → só as globais;
subcategorias por pai; categoria sem subcategorias → vazio; `leafCategoryRef` (subcategoria vence;
senão categoria; ambos vazios → vazio).
Ajustar `workspace-view-model.test.ts` (o teste do round-robin morre com o placeholder).
Cobrir a folha em `buildCreateInput`/`buildAdjustInput`.

**Vitest/jsdom**: escolher Centro filtra a Categoria; escolher a Categoria filtra a Subcategoria;
**trocar o Centro limpa** Categoria + Subcategoria.

## Follow-ups

- **Dado**: portar a taxonomia real do legado (core-api, ACL/ADR-0048) — sem isso a hierarquia existe
  mas não tem o que hierarquizar (todas as categorias são globais e sem filhas).
- **Refs por nível**: hoje o backend recebe só a folha em `categoryRef`. Se o domínio precisar do nível
  explícito (centro/categoria/subcategoria separados), é mudança de contrato do core-api.
- **Unificação `financial` × `budget-plans`**: taxonomia paralela aceita por ora (core-api #341).

## Gate

`pnpm typecheck` · `pnpm lint` · `pnpm test` (node) · `pnpm test:dom` · `pnpm build`.
