import type { ReactNode } from 'react'

/**
 * Contratos de tipo do organismo DataTable. View BURRA e agnóstica de domínio:
 * o header já chega traduzido (i18n na feature) e a célula é renderizada por composição.
 * Ver specs/009-design-system-organisms/data-model.md.
 */

export type ColumnAlign = 'start' | 'center' | 'end'
export type ColumnWidth = 'narrow' | 'normal' | 'wide'

export type Column<T> = Readonly<{
  /** Identidade estável da coluna (React key do cabeçalho/células). */
  key: string
  /** Texto do cabeçalho, já traduzido pela feature. */
  header: string
  /** Render da célula por composição (texto/badge/botão…). */
  cell: (row: T) => ReactNode
  /** Alinhamento do conteúdo. Default 'start'. */
  align?: ColumnAlign
  /** Escala semântica de largura (mapeada a CSS). Default 'normal'. */
  width?: ColumnWidth
}>

/**
 * Estado da tabela como união discriminada — estados mutuamente exclusivos
 * (impossível representar loading+error juntos). `empty` é derivado de `ready`
 * com `rows.length === 0`. Ver research R3.
 */
export type DataTableState<T> =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; message: string }>
  | Readonly<{ status: 'ready'; rows: readonly T[] }>

export type DataTableProps<T> = Readonly<{
  columns: readonly Column<T>[]
  state: DataTableState<T>
  /** Chave estável por linha (React key do <tr>). */
  rowKey: (row: T) => string
  /** Texto de "nenhum resultado" (i18n na feature). */
  emptyLabel: string
  /** Rótulo acessível do carregando (i18n na feature). */
  loadingLabel: string
  /** Nome acessível da tabela (aria-label). */
  caption?: string
  /** Opcional: torna as linhas clicáveis (hover + cursor + teclado). Ausente = linhas não interativas. */
  onRowClick?: (row: T) => void
}>
