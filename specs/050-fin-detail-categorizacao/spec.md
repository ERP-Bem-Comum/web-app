# Spec — 050 · FIN-DETAIL: Categorização no drawer de Detalhe do Documento

> Escala **M** (feature pequena). Slice front-doável do épico core-api#95 (FIN-DETAIL, camada BFF).
> Campo **#4 — Categorização**. Épico: campos #1 (arquivo/PDF, #256) e #6 (supplier server-side, #111)
> seguem gated; #5 (banco do favorecido) já feito.

## Contexto / Problema

O drawer de Detalhe do Documento (Contas a Pagar) exibe **"—"** nas linhas de **Centro de Custo,
Categoria, Subcategoria, Programa e Plano Orçamentário** com o comentário "gated core-api#95". Porém o
core-api **já devolve** as refs de categorização no `GET /api/v2/financial/documents/:id`
(`contractRef, budgetPlanRef, categoryRef, costCenterRef, programRef` — entregue no #147). O front
descarta essas refs: o schema Zod de borda do detalhe (`CoreApiDocumentSchema`) não as lê.

## Objetivo

Ler as refs que já chegam na resposta e resolvê-las para **nomes legíveis** no drawer, reutilizando as
fontes de referência que o "Lançar Documento" já carrega (categorias/centros de custo via
`list-financial-references`; programas via `listProgramsFn`). Degradação tolerante: cada linha cai para
"—" quando a ref é `null` **ou** não resolve.

## Escopo

### Server (BFF) — ler o que já vem

- `financial.schema.ts` · `CoreApiDocumentSchema`: adicionar `budgetPlanRef, categoryRef, costCenterRef,
programRef` (forma tolerante `z.string().trim().nullable().catch(null)`). Só os que o core devolve.
- `document.io.ts` · `DocumentDetail`: adicionar os 4 refs `string | null`.
- `financial.mappers.ts` · `detailToModel`: repassar os 4 refs adiante.

### Client — resolver ref→nome e renderizar

- `document.model.ts` (client) · `DocumentDetail`: espelhar os 4 refs.
- `contas-a-pagar.view-model.ts`: função **PURA** de resolução (`resolveCategorization`) + campo
  `categorization` no `DocumentDetailView`. Categoria×Subcategoria pela **cascata do `parentId`**
  (`categoryRef` é a FOLHA; com `parentId` → Categoria = pai, Subcategoria = folha; sem `parentId` →
  Categoria = folha, Subcategoria = "—").
- `document-detail.binding.ts`: construir os resolvers a partir das fontes já existentes
  (`referenceOptionsQuery` + `programOptionsQueryOptions`). Reutiliza cache; sem query nova.
- `document-detail-drawer.component.tsx`: trocar os placeholders "—" pelos nomes resolvidos.

## Fora de escopo (segue gated)

- **Plano Orçamentário**: sem fonte no front (budget-plans pende core-api#113) → permanece "—".
- Arquivo-fonte/PDF (#256) e supplierName/document server-side (#111).

## Critérios de aceite (US1 — P1)

1. Drawer com documento categorizado mostra os **nomes** de Centro de Custo, Categoria, Subcategoria e
   Programa (não mais "—").
2. `categoryRef` com `parentId` → Categoria = nome do pai, Subcategoria = nome da folha.
3. `categoryRef` sem `parentId` → Categoria = nome da folha, Subcategoria = "—".
4. Ref `null` ou não resolvível → linha exibe "—".
5. Plano Orçamentário permanece "—" (sem fonte no front hoje).
6. i18n: reutiliza `financial.detail.label.{centroCusto,categoria,subcategoria,programa,planoOrcamentario}`.

## Gates

`pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom`. Lint baseline: 0 erros /
115 warnings. Sem non-null assertion `!`.
</invoke>
