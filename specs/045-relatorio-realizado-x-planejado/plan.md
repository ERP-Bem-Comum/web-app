# Implementation Plan: Relatório "Realizado × Planejado"

**Spec**: `./spec.md` · **Tamanho**: M/L (novo relatório num módulo existente) · **Front-first**

## Abordagem

Segundo relatório dentro de `src/modules/reports/client/`, espelhando a estrutura do primeiro
("Fornecedores sem Contrato") e reusando o kit brand + a public-api do módulo. A matriz espelha o padrão do
**Consolidado ABC** (`consolidated-matrix.*`): primeira coluna sticky + scroll interno. Os gráficos reusam o
donut do Dashboard e um novo componente de barras horizontais, ambos SVG nativo (§VIII, sem lib).

## Camadas (MVVM · ADR-0009/0012 · §XI)

### Núcleo (agnóstico de framework — ZERO react/@tanstack)

- `client/data/realizado-x-planejado.placeholder.ts` — linhas cruas `RawBudgetRow`
  (centro/categoria/subcategoria/mês × {planejado, realizado, provisionado} em centavos). Planejado com
  valores REAIS do CSV legado (subset representativo: 7 CC, cada um com categoria + 2 subcategorias, 12
  meses). Realizado/Provisionado são **DEMO** (comentados) num subconjunto para os gráficos/AV% ficarem
  significativos.
- `client/realizado-x-planejado.view-model.ts` — agregação em árvore (CC→Cat→Subcat) somando por mês e
  totais das 3 medidas; AV% (guard ÷0→0); grand totals; agregações dos gráficos (por CC, por mês,
  realizado-vs-previsto); formatação (BRL, %); build do CSV. Meses DESC (tabela) / ASC (gráfico mensal).

### UI (views burras — recebem tudo por props)

- `page/realizado-x-planejado.page.tsx` — compõe header brand + filtros + toggle + (matriz | gráficos);
  UI-state local: toggle Gráfico/Tabela. Deriva tudo da ViewModel via `useMemo`.
- `components/realizado-matrix.component.tsx` + `.css.ts` — matriz sticky (grupo esquerdo congelado +
  cabeçalho de totais + grupos de mês DESC × 3 sub-colunas); expand/collapse local. Sticky via
  `globalStyle`/`position: sticky` com `left` acumulado e z-index/fundo opaco; scroll interno no contêiner
  (`overflow: auto` + `maxBlockSize`).
- `components/realizado-charts.component.tsx` + `.css.ts` — 3 gráficos (2 donuts reusando `DonutChart`, 1
  barras horizontais novo) com animação de entrada (useState false→true em useEffect; CSS transition,
  SSR-safe).
- `components/horizontal-bar-chart.component.tsx` + `.css.ts` — barras horizontais SVG (uma por mês, rótulo
  R$ no fim da barra; sem sobreposição).
- Reusa `report-filters.*` e `report-export-dropdown.*` do primeiro relatório.

### Tokens

- Cores dos gráficos (Realizado verde / Previsto ciano / Provisionado âmbar + paleta de 7 fatias do donut
  por CC) adicionadas a `grid-brand.values.ts` (único lugar com hex/px cru permitido — `*.values.ts`),
  mapeadas via `styleVariants` nos `.css.ts` e aplicadas como CLASSE (views não importam tokens).

## Plumbing

- Rota `src/routes/_authenticated/relatorios/realizado-x-planejado.tsx` → page pela public-api.
- Menu: 2º subitem no accordion "Relatórios" (`shell-menu.config.ts`), sem RBAC.
- `root.view-model.ts`: `PAGE_TITLES['/relatorios/realizado-x-planejado'] = 'Realizado × Planejado'`
  (fullBleed e showPageHeader já cobrem `/relatorios/*`).
- i18n `reports.realizadoXPlanejado.*` em `catalog.pt-BR.ts`.
- public-api: exporta a page + a ViewModel pura + tipos.

## Testes

- `tests/modules/reports/client/realizado-x-planejado.view-model.test.ts` (node:test): agregação em árvore,
  totais, AV% (incl. ÷0→0), ordenação de meses (tabela DESC / gráfico ASC), grand totals, CSV.

## Sticky + scroll interno (fix explícito da P.O.)

O contêiner da matriz tem `overflow: auto` + `maxBlockSize` (scroll H+V DENTRO dele). O grupo esquerdo usa
`position: sticky` com `insetInlineStart` acumulado por coluna e `zIndex` maior + fundo opaco (surface/
surfaceAlt) para as células de mês passarem por baixo. A página (`screen`) não rola horizontalmente porque a
matriz é `inlineSize: 100%` e o overflow vive nela.

## Riscos / decisões

- Realizado/Provisionado DEMO: decisão consciente (o legado real é 0) para os gráficos/AV% terem sinal;
  marcado por comentário. Quando o backend nascer, só a `data/` troca de fonte.
- Sem ADR novo: reusa decisões já registradas (ADR-0004/0009/0012); é uma fatia dentro do módulo existente.
