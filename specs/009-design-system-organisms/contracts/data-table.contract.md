# Contrato de UI — `DataTable<T>`

**Tipo**: organismo do design system (`ds-organism`). **View burra**, genérica em `T`.

**Import público**: `import { DataTable, type Column } from '#shared/ui'`

## Props

Ver `data-model.md` → `DataTableProps<T>`, `Column<T>`, `DataTableState<T>`.

## Comportamento contratual

| Estado (`state.status`) | Render esperado | Acessibilidade |
|---|---|---|
| `loading` | Indicador de carregamento; **nenhuma** linha de dados | `role="status"` + `loadingLabel` |
| `error` | `state.message` (texto já traduzido); layout íntegro | mensagem textual perceptível |
| `ready` + `rows.length === 0` | `emptyLabel` no corpo da tabela | mensagem textual |
| `ready` + `rows.length > 0` | `<tbody>`: uma `<tr>` por linha (`rowKey`), uma `<td>` por `column` via `column.cell(row)` | `<th scope="col">` por coluna |

- Estados **mutuamente exclusivos** (nunca dois ao mesmo tempo).
- Cabeçalho (`<thead>`) sempre renderiza `column.header`.
- `column.align`/`column.width` afetam apenas apresentação (tokens), não dados.
- Conteúdo não-textual (badge/botão) é suportado por `column.cell` retornar qualquer `ReactNode`.

## Invariantes (verificáveis)

- Não importa `modules/`, `data/`, `server/`, nem catálogo i18n (agnóstico — FR-004/FR-005).
- `.css.ts` só usa `vars.*` (FR-007) — sem hex/rgb/hsl/px crus.
- `switch` exaustivo sobre `state.status` com `const _: never`.
- Props `Readonly`; `rows` é `readonly T[]`.

## Critérios de aceite (mapeiam US1)

1. Dado `columns` + `state.ready` com linhas → cada linha exibe valores nas colunas corretas, na ordem.
2. Dado `state.ready` com `rows: []` → exibe `emptyLabel`.
3. Dado `state.loading` → exibe indicador, nenhuma linha real.
4. Dado `state.error` → exibe `message` sem quebrar layout.
5. Dado uma `column.cell` que retorna um badge → a célula renderiza o badge.

## Testes

- **DOM** (`tests/shared/ui/organisms/data-table.spec.tsx`): um caso por linha da tabela de critérios acima.
- **Visual** (`e2e/visual/organisms.visual.e2e.ts`): baseline dos 4 estados (loading, error, empty, ready com dados).
