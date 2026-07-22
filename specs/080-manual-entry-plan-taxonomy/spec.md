# 080 — Título manual da Conciliação carrega a taxonomia do plano (S2 do épico core-api #502)

> Escala **M**. Fonte da verdade: ADR-0051 (taxonomia por plano). Espelha a Fatia 1 (`specs/078`) + o refino
> S1 (`specs/079`) na **Nova Transação** da Conciliação, consumindo a fatia **S2 `FIN-MANUAL-ENTRY-TAXONOMY`**
> do épico **Taxonomia Planejável Unificada** (core-api #502), já mergeada na `dev` (PR #506).

## Princípio (do épico)

Existem **dois lugares onde um título nasce** e ambos precisam da taxonomia completa até a folha: (a) Lançar
Documento; (b) **Título manual na conciliação**. A conciliação **não classifica** — ela reflete o título. E
**o plano é o catálogo**: as opções de Centro/Categoria/Subcategoria vêm da árvore do plano, iguais em toda tela.

## Problema

A Nova Transação **não tinha Plano Orçamentário**, lia a cascata do **catálogo operacional** e **dobrava a folha**
em `categoryRef` (via `leafCategoryRef` — TODO #341 no código), sem `subcategoryRef` nem `budgetPlanRef`. Título
manual entrava "torto" no relatório Realizado × Planejado (S5/S6, que casa por plano+subcategoria).

## Decisão

Aplicar o padrão da Fatia 1 + S1 à Nova Transação:

- **Dropdown de Plano Orçamentário** (só APROVADOS + cenário no rótulo — mesma regra do documento, p/ não pegar
  rascunho homônimo). Dirige a **fonte** da cascata.
- **Cascata da ÁRVORE do plano** quando há plano selecionado (só nós ativos, `value` = `ref`); sem plano, cai no
  **catálogo operacional** (com o relabel de conciliação) — regime sem-plano do ADR-0051. Blindagem por UUID
  (`isPlanId`): valor que não é UUID → operacional (nunca esvazia em silêncio).
- **Carimbo SEPARADO** (não dobra mais a folha): envia `budgetPlanRef` + `categoryRef` (categoria) +
  `subcategoryRef` (folha) + `costCenterRef`. Trocar o Plano/Centro/Categoria zera os níveis de baixo (§IV).
- Categorização segue **oculta** p/ Transferência/Aplicação/Resgate (entre contas próprias — não classificam).

## Cadeia

`manual-entry.binding.ts` (estado + cascata plano-aware + submit) → `reconciliation.model.ts`
(`ManualEntryTemplate` ganha `budgetPlanRef` + `subcategoryRef`) → `reconciliation.io-schemas.ts`
(`ManualEntryTemplateSchema`, aditivos, guard `_g_manual` schema≡domínio) → body do POST
`/statement-transactions/:id/manual-entry` (`{...template}`, passa direto). UI: `new-transaction-pane.component.tsx`
(select de Plano no topo, dirigindo a cascata) + i18n `financial.recon.manual.f.plano`.

## Reuso (sem divergência, sem acoplar concerns)

Helpers PUROS `plan-taxonomy-cascade.ts` (`client/data`, já compartilhados com o documento) + budget-plans
public-api (`listBudgetPlansFn`/`getBudgetPlanDetailFn`). A query de planos-aprovados é replicada inline (12 linhas,
regra estável) p/ **não** importar binding de `document-create` (evita acoplar concern e risco de boundary).
`leafCategoryRef` **permanece** no helper — nada mais o usa no front (documento e agora conciliação carimbam
separado), mas fica até a limpeza final.

## Ajuste de layout (validado em tela pela P.O.)

Otimização de espaço no bloco de categorização da Nova Transação (token `ntRowCols3` novo, só-tokens):

- **Programa + Plano Orçamentário** lado a lado (2 colunas).
- **Centro de custo + Categoria + Subcategoria** numa linha de **3 colunas** (antes 2 + 1 sobrando).
- **Tipo de doc + Emissão + Valor** (campos chrome até core-api#370) numa linha de **3 colunas**, com rótulos
  encurtados (`Tipo de doc`, `Emissão`, `Valor`).
- Para Tarifa/Juros (único tipo não-payee que categoriza), Plano fica ao lado da Classificação (gated por tipo).

## Fora de escopo

- **Batch** (conciliação em lote) já propaga o `template` — que agora inclui plano+subcategoria — sem mudança extra.
- Resolver o `budgetPlanRef`/`subcategoryRef` p/ NOME na exibição do detalhe do lançamento manual = follow-up
  (mesma pendência do drawer de Contas a Pagar: resolver refs de plano contra a árvore, não o operacional).

## Verificação

`pnpm typecheck` + `pnpm verify` (1575 testes puros) + `pnpm test:dom` (572, +2 do dropdown de Plano). Lint 0 nos
tocados. Guard `_g_manual` garante schema ≡ domínio após os campos novos.
