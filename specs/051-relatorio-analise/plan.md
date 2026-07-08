# Plan 051 — Relatório "Análise de Pagamentos"

Fonte da forma/padrão: relatório **Realizado × Planejado** (RxP) — que já é uma **matriz árvore × meses**.
Reaproveita a pele da tabela (tree sticky, passador de meses WIN=3), os gráficos, os filtros recolhíveis e o
export dropdown. Diferença-chave do RxP: cada célula é **UM valor por mês** (não as 3 medidas provisionado/
realizado/planejado). ViewModel PURO (ADR-0009, §XI), views burras, só-tokens (§X).

## Arquivos NOVOS

1. `src/modules/reports/client/data/analise-pagamentos.placeholder.ts`
   - Constantes de domínio (SINTÉTICAS, sem PII). Tipo cru `RawAnaliseRow` (folha: `plano`/`costCenter` +
     `monthValues` mapa `YYYY-MM`→centavos) + `ANALISE_PERIOD` (`{start,end}` = jan–jun/2026, 6 meses).
     3 planos, cada um com 2-4 centros de custo.
2. `src/modules/reports/client/analise.view-model.ts`
   - PURO. Tipos `AnaliseLevel`, `AnaliseNode` (`{id,name,level,total,monthCells,children}`), `AnaliseReport`
     (`{totalPeriodo,months,planos}`), `CostCenterTotal`, `MonthTotal`.
   - **Geração de meses à prova de "Invalid Date":** `monthsInRange({start,end})` itera ano/mês inteiros sobre
     chaves `YYYY-MM` (nunca `Date`); `formatMonthLabel` deriva `Jan/26` por ÍNDICE de mês, com fallback honesto.
   - Agregações folha (CC) → Plano → Total do Período, por mês e no total. `totalByCostCenter` (desc, gráfico de
     barras), `totalByMonth` (série, gráfico mensal). `buildCsvHeader`/`buildCsv` (header base + colunas de mês).
     `formatBRL`/`formatBRLShort`/`formatPercent`/`sharePercent`. `loadAnalise(type:'p'|'r'='p')` — `'r'` retorna
     VAZIO (espelho futuro). Comentário do topo: fonte plugável quando o core-api subir.
3. `src/modules/reports/client/components/analise-table.component.tsx`
   - View BURRA: matriz árvore (Plano→CC) × meses, coluna VALOR TOTAL + passador WIN=3 (meses ASC), sticky 1ª
     col, rodapé "Valor total do período". Reusa `realizado-table.css.ts` + o passador/cartão da page do RxP.
     UI-state = nós expandidos + janela do passador. Valores em tinta neutra.
4. `src/modules/reports/client/components/analise-monthly-bars.component.tsx` + `analise-charts.css.ts`
   - Barras VERTICAIS de VALOR ("Distribuição Mensal"). `analise-charts.css.ts` re-exporta a geometria das
     barras verticais + tooltip da "Equipe ABC" e adiciona só a cor de valor (por classe; view não importa
     tokens). Rótulos de mês já vêm prontos e VÁLIDOS da ViewModel.
5. `src/modules/reports/client/page/analise-pagamentos.page.tsx` + `analise-pagamentos.page.css.ts`
   - Compõe: header → filtros recolhíveis + Exportar (dropdown PDF+CSV) → 2 gráficos (barras por CC via
     `realizado-cost-center-bars` + barras mensais, dentro de `realizado-charts-mount`) → tabela-matriz.
     UI-state = `filtersOpen`. CSV via Blob (`downloadCsv`), PDF `window.print`. O `.css.ts` re-exporta a pele
     da page do RxP e define só a grade de 2 gráficos (`charts2`).
6. `src/routes/_authenticated/relatorios/analise-pagamentos.tsx`
   - `createFileRoute` → `AnalisePagamentosPage` (via public-api). Sem RBAC.

## Arquivos MODIFICADOS

- `src/modules/reports/public-api/index.ts` — exporta a page + a ViewModel pura + tipos.
- `src/modules/shell/client/data/menu/shell-menu.config.ts` — subitem "Análise de Pagamentos".
- `src/modules/shell/client/root/viewModel/root.view-model.ts` — `PAGE_TITLES['/relatorios/analise-pagamentos']`.
- `src/shared/i18n/catalog.pt-BR.ts` — chaves `reports.analise.*` (title/filters/charts/columns/totals/tree/pager).
- `tests/modules/shell/client/root/root.view-model.test.ts` — 6º relatório + PAGE_TITLE novo.

## Reaproveitamento (do RxP e vizinhos)

- **Direto:** `report-export-dropdown`, `realizado-cost-center-bars`, `realizado-charts-mount`,
  `realizado-table.css.ts` (pele da matriz), a pele da page do RxP (cabeçalho/filtros/cartão de gráfico).
- **Sibling + CSS compartilhado** (padrão validado na Equipe/Posição): `analise-monthly-bars` reusa a geometria
  das barras verticais da "Equipe ABC" via re-export no `analise-charts.css.ts` — identidade idêntica, zero
  duplicação, RxP intacto. Cor de valor nova aplicada por `styleVariants`/classe (não é dinheiro-acoplado ao RxP).

## Testes

- `tests/modules/reports/client/analise.view-model.test.ts` (node:test) — `monthsInRange` (ASC, virada de ano,
  malformado→[], **zero Invalid Date**), `formatMonthLabel` (por índice + fallback), agregação Plano→CC×mês,
  Total do Período, `totalByCostCenter`/`totalByMonth`, `buildCsv`/`buildCsvHeader`, formatação, placeholder real.
- `tests/modules/reports/client/analise-pagamentos.page.spec.tsx` (vitest/jsdom) — filtros recolhíveis (toggle),
  matriz + linha total, passador de mês (Jan/26–Mar/26 → Abr/26–Jun/26; prev disabled→enabled), 2 gráficos,
  expand/collapse, export CSV dispara download.
- `root.view-model.test.ts` — título + subitem (6 relatórios).

## Gates

`pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom`. Baseline lint: 0 erros, 115 warnings.

## Riscos / decisões

- **Gráfico mensal:** o `realizado-line-chart` é fixo em N=12 meses; o período da Análise é variável (6 meses).
  Optou-se por **barras verticais** (alternativa prevista no escopo) reusando a pele da Equipe — evita
  distorcer a série e mantém a identidade brand.
- **Boundary client-ui ↛ ds-tokens:** cor de valor da barra mensal entra por classe no `.css.ts` (não `vars`
  inline na view).
- **Sem Date:** a única fonte de meses é `monthsInRange` + `formatMonthLabel` (parse por regex/split), garantindo
  ausência de "Invalid Date" — coberto por teste.
