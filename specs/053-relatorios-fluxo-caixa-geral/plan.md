# Plan 053 — Relatórios "Fluxo de Caixa" + "Relatório Geral"

Referência: `spec.md` (053). Arquitetura: ADR-0004 (split client×server), ADR-0009 (cliente agnóstico),
ADR-0012 (shell root), constituição §X (só-tokens) e §XI (MVVM · views burras). Front-first — sem server fn.

## Estratégia

Reusar TUDO que os relatórios existentes já provaram (molde de tela, `report-export-dropdown`, a PELE da tree
do Realizado × Planejado, o `BrandPaginator`, os helpers de mês blindados contra "Invalid Date"). Cada
relatório = ViewModel PURA (núcleo) + views BURRAS + wrapper de page fino + rota + testes. Nada de server fn.

## Arquivos

### Design tokens

- `src/shared/ui/brand/grid-brand.values.ts` — paleta `brand.color.fluxo.*` (realizado/previsto/entrada/
  saída/saldoPos/saldoNeg/barTrack) **+ os 3 tokens dos gráficos "Previsto × Realizado"**: `previstoChart`
  (ciano `#32a2c6`), `realizadoChart` (verde `#2f8f6a`), `saldoLine` (verde-claro `#7bc9a4`) — espelho do
  legado. Hex cru permitido (é um `*.values.ts`); a UI aplica por CLASSE. Os tokens dos KPIs/tabelas ficam
  intactos.

### Fluxo de Caixa

- `data/fluxo-caixa.placeholder.ts` — `RawFluxoLeaf` (Cat/Sub/mês/**Centro de Custo**/Realizado/Previsto) +
  `FLUXO_SAIDAS_RAW` (13 folhas, 4 categorias, 8 CCs sintéticos, jan–jun/26) + `FLUXO_ENTRADAS_RAW` (3 folhas,
  empty-state-ready) + `FLUXO_PERIOD`. LGPD ok (100% sintético).
- `fluxo-caixa.view-model.ts` — PURA: `aggregateSection` (Cat→Sub, 2 medidas), `computeSaldo`, `monthlyFlow`
  (série por vencimento, retrocompatível), **`buildTimeline`** (Esperado/Realizado/Saldo por período — bruto ×
  bruto × líquido; Saldo pode negativar), **`aggregateByCostCenter`** (Previsto × Realizado por CC, desc por
  Realizado), **`sectionDonutData`**/**`executionPercent`**/**`formatPercent`** (donuts), `buildReport`/
  `loadFluxoCaixa`, `monthsInRange`/`formatMonthLabel` (por ordinal — nunca `Date`), `buildCsv`, `formatBRL`/
  `formatBRLShort`. ZERO React/TanStack.
- `components/fluxo-caixa-tree-table.css.ts` — RE-EXPORTA a pele da tree do RxP; `gridCols` (3 col),
  `measureTone` (Realizado/Previsto via `fluxo.*`), empty-panel.
- `components/fluxo-caixa-section-table.component.tsx` — view BURRA de UMA seção (tree 2 níveis + total +
  empty-state honesto). **MANTIDA.**
- `components/fluxo-caixa-timeline.css.ts` + `.component.tsx` — **NOVO** gráfico "Linha do tempo" (3 séries,
  SVG nativo, escala com base ZERO p/ o Saldo negativo; cores por classe `lineTone`; base do SVG/tooltip
  reusada do RxP). Rótulos de período por ÍNDICE (a view não instancia `Date`).
- `components/fluxo-caixa-monthly-bars.css.ts` — pele das barras AGRUPADAS; **estendida** com `barTone`/
  `swatchTone` `previsto`/`realizado` (ciano/verde). O `.component.tsx` monthly (Entradas × Saídas) foi
  **removido** (substituído pelos 4 gráficos); a CSS segue servindo o gráfico de CC.
- `components/fluxo-caixa-cost-center-bars.component.tsx` — **NOVO** barras AGRUPADAS Previsto × Realizado por
  Centro de Custo, reusando a CSS acima.
- `components/realizado-donut.component.tsx` + `realizado-charts.css.ts` — donut REUSADO; `MeasureKey` e as 3
  styleVariants ganham `fluxoPrevisto`/`fluxoRealizado` (ciano/verde) — extensão aditiva (RxP/Posição intactos).
- `page/fluxo-caixa.page.css.ts` — RE-EXPORTA a pele do RxP; `kpiAccentFluxo`, `saldoValueTone`, `chart1` +
  **`charts2`** (2 donuts lado a lado), `sections`.
- `page/fluxo-caixa.page.tsx` — wrapper: KPIs + **4 gráficos** + 2 seções + filtros (+ Subcategoria + Status)
  - Exportar (CSV/PDF).
- `src/routes/_authenticated/relatorios/fluxo-caixa.tsx`.

### Relatório Geral

- `data/relatorio-geral.placeholder.ts` — `LedgerRow` (15 colunas, nullable) + ~24 linhas MISTAS (saídas
  reais-like + entradas placeholder). Datas já "DD/MM/AAAA".
- `relatorio-geral.view-model.ts` — PURA: `loadRelatorioGeral`, `total`, paginação (`totalPages`/`pageSlice`),
  `buildCsv` (nullable → campo vazio), `formatBRL`. ZERO React/TanStack.
- `components/relatorio-geral-table.css.ts` — 15 colunas, scroll horizontal, thead sticky.
- `components/relatorio-geral-table.component.tsx` — view BURRA (nullable → "—" via prop; empty-state).
- `page/relatorio-geral.page.css.ts` — RE-EXPORTA a pele do RxP + `exportTrigger`.
- `page/relatorio-geral.page.tsx` — wrapper: filtros + tabela paginada + `BrandPaginator` + Exportar.
- `src/routes/_authenticated/relatorios/geral.tsx`.

### Wiring

- `public-api/index.ts` — exporta as 2 pages + as ViewModels/tipos.
- `shell-menu.config.ts` — +2 subitens de "Relatórios" (Fluxo de Caixa, Relatório Geral).
- `root.view-model.ts` — +2 `PAGE_TITLES`.
- `catalog.pt-BR.ts` — `reports.fluxoCaixa.*` + `reports.geral.*`.

## Boundaries protegidos (§XI / ADR-0009)

- ViewModels (`*.view-model.ts`) NÃO importam `react`/`@tanstack/react-*` — só derivações puras (node:test).
- Views (`*.component.tsx`) recebem tudo por props/i18n; não tocam `data/` nem `server/`.
- Cross-módulo só pela `public-api`; as rotas consomem por ela.
- Cor por dado entra por `styleVariants` no `*.css.ts` (as views não importam tokens).

## Testes (espelham `src/` em `tests/`)

- node:test: `fluxo-caixa.view-model.test.ts` (agregação por seção, saldo, Entradas=[] → 0 sem quebrar,
  série mensal, **`buildTimeline`** — somas por período + Saldo negativo, **`aggregateByCostCenter`** — agrega
  por CC das Saídas, **`sectionDonutData`/`executionPercent`** — donuts + caminho vazio, guard Invalid Date,
  CSV) · `relatorio-geral.view-model.test.ts` (paginação, CSV nullable→vazio, placeholder). Empty paths cobertos.
- Vitest DOM: `fluxo-caixa.page.spec.tsx` (2 seções + **os 4 gráficos** por título + **os 2 filtros novos** +
  export; seção Entradas vazia → empty-state; **donut de totais 0 → placeholder honesto**) ·
  `relatorio-geral.page.spec.tsx` (tabela + paginação + export; lista vazia → empty-state).
- `root.view-model.test.ts`: +2 títulos, +2 subitens de menu.

## Gates

`pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom` — todos verdes; lint no baseline
(0 erros / 115 warnings). NÃO commitar; NÃO rebuildar Docker.
