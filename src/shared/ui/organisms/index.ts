/**
 * Barrel dos organismos do design system (`ds-organism`). Porta da camada `organisms/`,
 * reexportada por `#shared/ui`. Organismos compõem atoms/molecules e são views BURRAS,
 * agnósticas de domínio (só dependem de tokens/atoms/molecules — fronteira enforçada por lint).
 * Ver specs/009-design-system-organisms.
 */
export { DataTable } from './data-table/index.ts'
export type {
  Column,
  ColumnAlign,
  ColumnWidth,
  DataTableState,
  DataTableProps,
} from './data-table/index.ts'
export { PageHeader, type PageHeaderProps } from './page-header/index.ts'
