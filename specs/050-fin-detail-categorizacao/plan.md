# Plan — 050 · FIN-DETAIL: Categorização no drawer

## Constitution Check (§I–§XII)

- **§I Vertical-modular**: tudo em `src/modules/financial`. Programas via `programs/public-api` (cross-módulo
  só por public-api); referências via repository do próprio módulo. OK.
- **§II Erros como valores**: `detailToModel` já retorna `Result`; sem `throw` novo. OK.
- **§III Server fn = única fronteira**: nenhuma composição nova no client; refs vêm na `fn` de detalhe já
  existente (`get-document`). OK.
- **§IV Estados ilegais**: refs `string | null`; cascata de categoria trata os 3 casos (folha/pai/ausente). OK.
- **§V Cadeia de erro**: inalterada. OK.
- **§VI TS estrito e apagável**: sem `any`/`enum`; sem `!`. Uniões e `Readonly`. OK.
- **§IX Zod na borda**: refs entram por `z.string().trim().nullable().catch(null)` (drift-tolerante). OK.
- **§X Design system**: sem CSS novo (reusa `Field`/`detailGrid`/`paymentCard`). OK.
- **§XI MVVM**: resolução PURA na view-model (`resolveCategorization`); React só no `*.binding.ts`; view burra
  só apresenta `view.categorization`. OK.

## Passos

### 1. Server

- `financial.schema.ts`: +4 refs em `CoreApiDocumentSchema`.
- `document.io.ts`: +4 refs em `DocumentDetail`.
- `financial.mappers.ts`: `detailToModel` repassa os 4 refs.

### 2. Client model

- `document.model.ts`: +4 refs em `DocumentDetail` (espelho).

### 3. Client view-model (PURO)

- Tipos `CategoryNode`, `CategorizationResolvers`, `CategorizationView`.
- `resolveCategorization(d, resolvers?)`: cascata `parentId`; `null`/não-resolve → "—".
- `DocumentDetailView.categorization: CategorizationView`.
- `mapDocumentDetail(d, resolveSupplier, resolveDoc?, catResolvers?)`.

### 4. Binding

- `document-detail.binding.ts`: `useQuery(referenceOptionsQuery)` + `useQuery(programOptionsQueryOptions)`;
  `useMemo` monta os resolvers (Maps `id→node/name`). `budgetPlan` → sempre `null` (sem fonte, #113).
- Exportar `referenceOptionsQuery` (de `category-options.binding.ts`) e `programOptionsQueryOptions`
  (de `program-options.binding.ts`) para reuso do cache.

### 5. View

- `document-detail-drawer.component.tsx`: `Field value={view.categorization.*}`; atualizar comentário
  (resolvido client-side; Plano segue gated core-api#113).

### 6. Testes

- node:test `financial-mappers.test.ts`: `detailToModel` lê os 4 refs; ausentes → null.
- node:test `contas-a-pagar-view-model.test.ts`: `mapDocumentDetail` resolve refs→nomes; null→"—";
  categoria/subcategoria via `parentId` (folha/pai/ausente).
- vitest DOM `document-detail-drawer.spec.tsx`: mostra nomes resolvidos; "—" quando não há; Plano "—".

## Riscos

- Reuso de cache entre `document-create` e `contas-a-pagar-list`: mesma queryKey → 1 fetch. Baixo risco.
- `budgetPlanRef` sem fonte → decisão consciente de manter "—" (não inventar).
  </content>
