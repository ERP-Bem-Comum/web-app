# Plan 048 — Relatório "Posição de Pagamentos"

Fonte da forma/padrão: relatório **Realizado × Planejado** (RxP) — reaproveita a pele da tabela (tree RxP com
childBg por nível, nó-folha, sticky 1ª col), os KPIs, os gráficos SVG (donut + barras horizontais), os filtros
recolhíveis e o export dropdown. As **3 medidas são DERIVADAS** (contrato ratificado na spec): **Em atraso ·
Pago · A pagar** (Conciliado conta como Pago; Rascunho/Recusado fora).

## Arquivos NOVOS

1. `src/modules/reports/client/data/posicao-pagamentos.placeholder.ts`
   - Constantes de domínio (SINTÉTICAS). Tipo cru `RawPosicaoRow` (folha: supplier/costCenter/category +
     `emAtrasoCents/pagoCents/aPagarCents`). ~4-6 fornecedores, árvore realista pt-BR (maioria em Em atraso).
2. `src/modules/reports/client/posicao.view-model.ts`
   - PURO. Tipos `PosicaoLevel`, `PosicaoMeasures` (`{emAtrasoCents,pagoCents,aPagarCents}`), `PosicaoNode`,
     `PosicaoReport`, `SupplierTotal`. Agregações folha→CC→fornecedor→geral. `measureTotal`, `supplierTotals`
     (total por fornecedor desc, barras), `formatBRL`/`formatBRLShort`/`formatPercent`/`sharePercent`,
     `buildCsv`, `loadPosicao(type:'p'|'r'='p')`. Contrato de derivação + futuro `type` no comentário do topo.
3. `src/modules/reports/client/components/posicao-tree-table.component.tsx` + `.css.ts`
   - View BURRA: árvore 3 níveis (chevron/recuo/sticky 1ª col), 3 colunas Em atraso/Pago/A pagar, nome+total
     na linha do fornecedor, subtotais na linha-pai, rodapé Total Geral. Pele **RxP**. UI-state = nós expandidos.
4. `src/modules/reports/client/components/posicao-kpis.component.tsx`
   - 4 cards (Atrasado/Pago/A pagar/Total) na pele dos KPIs do RxP (barra de acento colorida).
5. `src/modules/reports/client/page/posicao-pagamentos.page.tsx` + `.css.ts`
   - Compõe: header → filtros recolhíveis (`report-filters`) + Exportar (`report-export-dropdown` PDF+CSV) →
     4 KPIs → 2 gráficos (donut "Resumo total" + barras "Distribuição por Fornecedor", via componentes do RxP
     - `realizado-charts-mount`) → tabela. UI-state = `filtersOpen`. CSV via Blob (`downloadCsv`), PDF `window.print`.
6. `src/routes/_authenticated/relatorios/posicao-pagamentos.tsx`
   - `createFileRoute` → `PosicaoPagamentosPage` (via public-api). Sem RBAC.

## Arquivos MODIFICADOS

- `src/modules/reports/public-api/index.ts` — exporta a page + a ViewModel pura + tipos.
- `src/modules/shell/client/data/menu/shell-menu.config.ts` — subitem "Posição de Pagamentos".
- `src/modules/shell/client/root/viewModel/root.view-model.ts` — `PAGE_TITLES['/relatorios/posicao-pagamentos']`.
- `src/shared/ui/brand/grid-brand.values.ts` — bloco `color.posicao` (4 cores: emAtraso/pago/aPagar/total).
- `src/shared/i18n/catalog.pt-BR.ts` — chaves `reports.posicao.*` (measure/kpi/chart/columns/filters, 3 medidas).

## Testes

- `tests/modules/reports/client/posicao.view-model.test.ts` (node:test) — agregações folha→CC→fornecedor→
  geral das 3 medidas + `supplierTotals` + CSV builder (header pt-BR das 3 medidas, valores BRL).
- `tests/modules/reports/client/posicao-pagamentos.page.spec.tsx` (vitest DOM) — filtros recolhíveis, 4 cards,
  2 gráficos, tabela + Total Geral, expand/collapse, export CSV (item do dropdown) dispara.
- `tests/modules/shell/client/root/root.view-model.test.ts` — +título e +contagem de subitens do menu.

## Posição de Recebimentos (`type: 'r'`) — ENTREGUE (espelho da de Pagamentos)

Reaproveita AO MÁXIMO o engine + as views (feitas NEUTRAS). Só a fonte e os rótulos mudam.

### Arquivos NOVOS (recebimentos)

1. `src/modules/reports/client/data/posicao-recebimentos.placeholder.ts`
   - `POSICAO_RECEBIMENTOS_RAW: readonly RawPosicaoRow[]` (reusa o tipo cru de Pagamentos). ~5 **financiadores**
     → CC → categoria, valores sintéticos (sem PII). Comentário: PLACEHOLDER só p/ validar; some (→ `[]`) quando
     o Contas a Receber subir → tela cai no empty state.
2. `src/modules/reports/client/components/posicao-report-view.component.tsx`
   - CORPO compartilhado da tela (extraído da page de Pagamentos): `report` + `labels` (TODOS os rótulos i18n)
     - `csvFilename` + `csvHeader`. Contém o **empty state honesto** (`report.suppliers` vazio / total 0 →
       só cabeçalho + painel "Nenhum recebimento registrado", sem KPIs/gráficos/tabela). UI-state = `filtersOpen`.
3. `src/modules/reports/client/page/posicao-recebimentos.page.tsx`
   - Wrapper FINO: `loadPosicao('r')` + rótulos `reports.posicao.rec.*`/compartilhados → `PosicaoReportView`.
4. `src/routes/_authenticated/relatorios/posicao-recebimentos.tsx`
   - `createFileRoute` → `PosicaoRecebimentosPage` (via public-api). Sem RBAC.

### Arquivos MODIFICADOS (recebimentos)

- `posicao.view-model.ts` — `loadPosicao('r')` agrega o placeholder de recebimentos; `buildCsv(report, header?)`
  parametrizado; `CSV_HEADER_RECEBIMENTOS`. Pagamentos intacto.
- `posicao-pagamentos.page.tsx` — refatorada p/ wrapper fino do `PosicaoReportView` (mesmos textos → intacta).
- `posicao-pagamentos.page.css.ts` — `emptyPanel`/`emptyTitle`/`emptyHint` (empty state, só-tokens).
- `public-api/index.ts` — exporta `PosicaoRecebimentosPage` + `CSV_HEADER_RECEBIMENTOS`.
- `shell-menu.config.ts` — subitem "Posição de Recebimentos".
- `root.view-model.ts` — `PAGE_TITLES['/relatorios/posicao-recebimentos']`.
- `catalog.pt-BR.ts` — chaves `reports.posicao.rec.*` (title/financiador/recebido/aReceber/empty/chart/table/kpi
  subs); as compartilhadas NÃO são duplicadas.

### Testes (recebimentos)

- `tests/modules/reports/client/posicao-recebimentos.view-model.test.ts` (node:test) — `loadPosicao('r')` agrega
  o placeholder; Total Geral bate; **caso VAZIO (`[]`) → 0 nós, totais 0**; CSV header de recebimentos.
- `tests/modules/reports/client/posicao-recebimentos.page.spec.tsx` (vitest DOM) — COM placeholder: 4 cards +
  2 gráficos + tabela (Financiador) + export; **caso VAZIO → empty state "Nenhum recebimento registrado"** (via
  `PosicaoReportView` com relatório vazio injetado).
- `posicao.view-model.test.ts` — o teste de `'r'` passou a validar a fonte de recebimentos (≠ Pagamentos).
- `root.view-model.test.ts` — +título e +subitem (5 relatórios).

## Estrutura NEUTRA (`type: 'p' | 'r'`) — realizada

- Shape `PosicaoNode`/`PosicaoReport` NEUTRO (level enum, name string) — serve Pagamentos e Recebimentos.
- `loadPosicao(type)` é o único ponto de escolha da fonte; hoje ambos com placeholder front-first.
- Rótulos de nível (Fornecedor/Financiador) por i18n/props → `PosicaoReportView` única reutilizável.

## Gates

`pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom`. Baseline lint 0/115.
