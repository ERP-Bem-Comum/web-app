# Implementation Plan: Relatório "Fornecedores sem Contrato"

**Spec**: `./spec.md` · **Size**: M (feature pequena, front-first, placeholder-data)

## Abordagem (o "como")

Novo módulo vertical `src/modules/reports/` com a fatia client (MVVM). Front-first: sem `server/` ainda
(core-api#114 não existe) — os dados vêm de constantes placeholder na `client/data/`.

### Estrutura

```
src/modules/reports/
  public-api/index.ts                        # exporta só o que a rota precisa
  client/
    data/suppliers-without-contract.placeholder.ts   # constantes (cents), fiel ao CSV legado
    suppliers-without-contract.view-model.ts          # PURO (zero React): agregação + math + format + CSV
                                                      #   + topSuppliersByValor / complianceCounts (gráfico)
    page/suppliers-without-contract.page.tsx          # view (header brand + filtros recolhíveis + gráfico + tabela)
    page/suppliers-without-contract.page.css.ts       # toggle "Filtros" + colapsável + card/legenda do gráfico
    components/
      report-filters.component.tsx / .css.ts          # toolbar/painel brand (reusa brand-filters kit)
      supplier-tree-table.component.tsx / .css.ts      # tree-table brand (chevron, indent, danger)
      supplier-compliance-bars.component.tsx / .css.ts # gráfico de barras horizontais (cor por status)
      report-export-dropdown.component.tsx / .css.ts   # Exportar → CSV/PDF (padrão Contratos)
      realizado-charts-mount.component.tsx             # (reuso) wrapper de animação de entrada, SSR-safe
tests/modules/reports/client/suppliers-without-contract.view-model.test.ts   # node:test puro
```

### ViewModel (pura, agnóstica de framework — ADR-0009, §XI)

- Dinheiro em **cents** (inteiros, §IV). `type Cents = number` branded leve.
- `aggregateSuppliers(raw, limiteCents)`: agrupa por fornecedor (ordem de inserção — casa o print legado),
  soma planos; por fornecedor soma VALOR TOTAL; deriva `utilizadoPct`, `totalRestante`, `overLimit`.
- Helpers puros: `formatBRL(cents)`, `formatPercent(pct)` (2 int zero-pad + 2 dec + "%"), `buildCsv(rows)`.
- `LIMITE_DEFAULT_CENTS = 1_000_000`.

### View (burra) + binding React mínimo

- A page usa `useState` local para o input **Limite**, o conjunto de fornecedores expandidos e o toggle
  **filtersOpen** (UI-state) — tudo o mais é derivação pura via ViewModel. Sem TanStack Query (sem server-state).
- Filtros Programa/Plano/Período/Centro/Categoria/Subcategoria = selects nativos placeholder (sem data),
  agora dentro do painel **recolhível** (fechado por padrão; toggle "Filtros" no cabeçalho).
- Tree-table espelha o pattern da matriz consolidada (chevron, indent por `depth`, danger via styleVariants).
- Gráfico de compliance: barra burra recebe `{ id, name, utilizadoPct, status, valueLabel }` já derivados
  pela page (via `topSuppliersByValor` + mapa `overLimit/atLimit → over/at/within`). Largura visual trava em
  100% (marcador do Limite); cor por classe (styleVariants `over/at/within`, reusa danger/atLimit/primary).
  Animação de entrada pelo `RealizadoChartsMount` (requestAnimationFrame → CSS transition, SSR-safe).

### Export (client-side)

- CSV: Blob `text/csv` delimitado por `;`, header `"Fornecedor";"BudgetPlan";"Total"`, download via anchor.
- PDF: `window.print()` (padrão Contratos ExportDropdown).

### Plumbing

- Rota: `src/routes/_authenticated/relatorios/fornecedores-sem-contrato.tsx` → `/relatorios/...`.
- Menu: `Relatórios` (shell-menu.config) vira accordion com subitem → a rota. Sem `requiredPermission`.
- `root.view-model`: `fullBleedContent` cobre `/relatorios/*`; `PAGE_TITLES` entry; `showPageHeader` false
  para `/relatorios` (a page desenha o próprio header brand). Testes do root atualizados.
- i18n: chaves `reports.*` no catálogo pt-BR.

## Constitution Check (§I–§XII)

- §I vertical-modular: novo módulo `reports/` com `public-api`. ✔
- §IV estados ilegais: cents inteiros; união discriminada no estado da tabela. ✔
- §VI TS estrito/apagável: sem any/enum/namespace. ✔
- §X só-tokens: `*.css.ts` só `vars.*`/`brand.*`; px/hex cru só em `*.values.ts` (reusa `grid-brand.values`). ✔
- §XI MVVM: ViewModel pura (sem react/@tanstack/react-_); View burra; React só nos `_.component.tsx`. ✔
- §III server fn: N/A nesta fatia (placeholder); quando #114 nascer, entra `server/` + repository. ✔

## Gates

`pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom` — verde, sem novos erros de lint.

## Deviations / Assumptions

- Ordem de inserção dos fornecedores (não ordena por valor) para casar o print legado.
- Filtros não-Limite são visuais (sem fonte de dados) — assumido pelo escopo front-first.
