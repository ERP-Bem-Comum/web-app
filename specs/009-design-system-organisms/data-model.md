# Data Model — Fundação de Organismos (Phase 1)

> "Dados" aqui = **contratos de tipos** das props (a API pública dos organismos). Não há entidades de
> persistência. Tipos em TS strict, `Readonly`/`readonly`, sem `any`, sem `enum` (união de literais).

## DataTable

### `Column<T>`

Descreve uma coluna. Agnóstica de domínio: o header já vem traduzido (i18n na feature) e a célula é renderizada por composição.

| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `key` | `string` | sim | Identidade estável da coluna (React key do `<th>`/células). |
| `header` | `string` | sim | Texto do cabeçalho **já traduzido** pela feature (FR-006/R2). |
| `cell` | `(row: T) => ReactNode` | sim | Render da célula por composição (badge/botão/texto) — R4. |
| `align` | `'start' \| 'center' \| 'end'` | não | Alinhamento do conteúdo. Default `'start'`. |
| `width` | `'narrow' \| 'normal' \| 'wide'` | não | Escala semântica (mapeada a tokens, sem px cru) — R9. Default `'normal'`. |

```ts
export type ColumnAlign = 'start' | 'center' | 'end'
export type ColumnWidth = 'narrow' | 'normal' | 'wide'

export type Column<T> = Readonly<{
  key: string
  header: string
  cell: (row: T) => ReactNode
  align?: ColumnAlign
  width?: ColumnWidth
}>
```

### Estado da tabela — união discriminada (R3)

```ts
export type DataTableState<T> =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; message: string }>   // message já traduzida pela feature
  | Readonly<{ status: 'ready'; rows: readonly T[] }> // empty = ready com rows.length === 0
```

- **Estados mutuamente exclusivos** (FR-009): impossível representar loading+error ao mesmo tempo.
- **empty** é derivado: `status === 'ready' && rows.length === 0` → renderiza `emptyLabel`.

### `DataTableProps<T>`

| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `columns` | `readonly Column<T>[]` | sim | Definição das colunas. |
| `state` | `DataTableState<T>` | sim | Estado atual (loading/error/ready). |
| `rowKey` | `(row: T) => string` | sim | Chave estável por linha (React key do `<tr>`). |
| `emptyLabel` | `string` | sim | Texto de "nenhum resultado" (i18n na feature). |
| `loadingLabel` | `string` | sim | Texto/rótulo acessível do carregando (i18n). |
| `caption` | `string` | não | `aria-label`/caption da tabela (acessibilidade — R6). |

```ts
export type DataTableProps<T> = Readonly<{
  columns: readonly Column<T>[]
  state: DataTableState<T>
  rowKey: (row: T) => string
  emptyLabel: string
  loadingLabel: string
  caption?: string
}>
```

**Regras / invariantes:**
- View burra: sem fetch, sem estado de negócio, sem data-hooks.
- `switch (state.status)` exaustivo com `const _: never = state` no default.
- Render: `loading` → indicador + `role="status"` (sem linhas); `error` → `state.message`; `ready` com `rows.length===0` → `emptyLabel`; `ready` com linhas → `<tbody>` mapeando `rows` × `columns`.
- Sem px/cor crus no `.css.ts` (só `vars.*`); larguras via `ColumnWidth`.

## PageHeader

### `PageHeaderProps`

| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `title` | `string` | sim | Título da página (i18n na feature). |
| `subtitle` | `string` | não | Descrição/subtítulo opcional. |
| `actions` | `ReactNode` | não | Slot de ações (ex.: `<Button>`) por composição — R7. |

```ts
export type PageHeaderProps = Readonly<{
  title: string
  subtitle?: string
  actions?: ReactNode
}>
```

**Regras / invariantes:**
- View burra; sem lógica de negócio.
- Layout consistente com/sem `subtitle` e com/sem `actions` (acceptance US2).
- Tipografia/espaçamento via `vars.*`.

## Tipos compartilhados / barrel

- `data-table/index.ts` re-exporta: `DataTable`, `Column`, `ColumnAlign`, `ColumnWidth`, `DataTableState`, `DataTableProps`.
- `page-header/index.ts` re-exporta: `PageHeader`, `PageHeaderProps`.
- `organisms/index.ts` re-exporta ambos.
- `shared/ui/index.ts` adiciona `export * from './organisms/index.ts'`.

Consumo final esperado:
```ts
import { DataTable, PageHeader, type Column } from '#shared/ui'
```
