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
    page/suppliers-without-contract.page.tsx          # view (compõe header brand + filtros + tree-table)
    components/
      report-filters.component.tsx / .css.ts          # toolbar/painel brand (reusa brand-filters kit)
      supplier-tree-table.component.tsx / .css.ts      # tree-table brand (chevron, indent, danger)
      report-export-dropdown.component.tsx / .css.ts   # Exportar → CSV/PDF (padrão Contratos)
tests/modules/reports/client/suppliers-without-contract.view-model.test.ts   # node:test puro
```

### ViewModel (pura, agnóstica de framework — ADR-0009, §XI)

- Dinheiro em **cents** (inteiros, §IV). `type Cents = number` branded leve.
- `aggregateSuppliers(raw, limiteCents)`: agrupa por fornecedor (ordem de inserção — casa o print legado),
  soma planos; por fornecedor soma VALOR TOTAL; deriva `utilizadoPct`, `totalRestante`, `overLimit`.
- Helpers puros: `formatBRL(cents)`, `formatPercent(pct)` (2 int zero-pad + 2 dec + "%"), `buildCsv(rows)`.
- `LIMITE_DEFAULT_CENTS = 1_000_000`.

### View (burra) + binding React mínimo

- A page usa `useState` local só para o input **Limite** (UI-state) e para o conjunto de fornecedores
  expandidos (UI-state) — tudo o mais é derivação pura via ViewModel. Sem TanStack Query (sem server-state).
- Filtros Programa/Plano/Período/Centro/Categoria/Subcategoria = selects nativos placeholder (sem data).
- Tree-table espelha o pattern da matriz consolidada (chevron, indent por `depth`, danger via styleVariants).

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
