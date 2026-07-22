# 079 — Carimbo da subcategoria no documento (S1 do épico core-api #502)

> Escala **M** (refino de fatia). Fonte da verdade: ADR-0051 (taxonomia por plano). Refina a Fatia 1
> (`specs/078-categorization-from-plan-tree`) consumindo a fatia **S1 `FIN-DOC-SUBCATEGORY-STAMP`** do
> épico **Taxonomia Planejável Unificada** (core-api #502), já mergeada na `dev` (PR #504).

## Problema

O Lançar Documento **dobrava a folha** da cascata em `categoryRef`: quando havia subcategoria escolhida,
era ELA que ia ao backend em `categoryRef` (via `leafCategoryRef`) — porque o core-api tinha **um campo só**
("subcategoria = categoria com `parentId`"). Com a S1, o documento passou a ter `subcategory_ref` dedicado, e
o relatório Realizado × Planejado (S6) **casa pela folha `subcategoryRef`**, ignorando `categoryRef`. Continuar
dobrando esconderia o grão fino do relatório.

## Decisão

Carimbar **categoria e subcategoria em campos SEPARADOS**:

- `categoryRef` = a Categoria escolhida.
- `subcategoryRef` = a Subcategoria (folha da árvore do plano). Vazia → não enviada.

Regra igual no create e no rascunho. O **AJUSTE** (PATCH) não recategoriza (o core-api não aceita) → intacto.
`leafCategoryRef` **permanece** no helper `categorization-cascade.ts` porque a **Conciliação** (Nova transação)
ainda dobra — a coerência dela é a fatia S2 (Fatia 3), separada.

## Cadeia (write)

`document-form.view.ts` (build) → `financial.io-schemas.ts` (Zod da server-fn, `subcategoryRef` aditivo opcional)
→ `document.io.ts` (input do domínio) → body do POST `/documents` (`{ asDraft, ...input }`, passa direto).

## Cadeia (read — sem regredir o drawer)

`financial.schema.ts` (view do core-api, `subcategoryRef` drift-tolerante `.catch(null)`) → `financial.mappers.ts`
(`detailToModel`) → `document.model.ts`/`document.io.ts` (`DocumentDetail.subcategoryRef: string | null`) →
`contas-a-pagar.view-model.ts` (`resolveCategorization`): a folha vira **`subcategoryRef ?? categoryRef`**.

**Backward-compatible:** a MESMA decodificação por `parentId` cobre os dois mundos —

- doc **novo**: `subcategoryRef` presente (com `parentId` = categoria) → Categoria = pai, Subcategoria = folha;
- doc **antigo**: `subcategoryRef` null → a folha vem de `categoryRef` (a folha dobrada de antes), sem mudança.

## Fora de escopo (ressalvas registradas)

- **Drawer resolve contra o catálogo OPERACIONAL**, não a árvore do plano → refs de plano (Fatia 1) seguem "—"
  no drawer. Gap pré-existente da Fatia 1; follow-up = resolver o drawer contra a árvore do plano.
- **Hidratação** de edição/rascunho continua zerando a categorização (core-api #95). Fora deste refino.
- Reclassificar os 91 documentos legados = decisão nº 4 do épico (ficam de fora; regra nova só p/ novos).

## Verificação

`pnpm verify` (typecheck + lint + 1577 testes puros) + `pnpm test:dom` (570). Cobertura nova:
`buildCreateInput`/`buildDraftInput` (campos separados) e `resolveCategorization` (precedência da subcategoria

- compat com docs antigos).
