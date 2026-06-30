import type { KeyboardEvent, ReactNode } from 'react'

import {
  align,
  clickableRow,
  container,
  errorCell,
  stateCell,
  table,
  td,
  th,
  width,
} from './data-table.css.ts'
import type { Column, DataTableProps, DataTableState } from './data-table.types.ts'

/**
 * DataTable (organismo) — BURRO e agnóstico de domínio: recebe colunas, estado e textos por
 * props (a feature resolve i18n). `<table>` semântico (`<th scope="col">`). O estado é uma união
 * discriminada (loading | error | ready); `empty` = ready com zero linhas. Estilo 100% via tokens.
 */
function cx(...classes: readonly (string | undefined)[]): string {
  return classes.filter((c): c is string => c !== undefined).join(' ')
}

export function DataTable<T>(props: DataTableProps<T>): ReactNode {
  const { columns, state, rowKey, emptyLabel, loadingLabel, caption, onRowClick } = props
  const colCount = columns.length

  return (
    <div className={container}>
      <table className={table} aria-label={caption}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(th, align[column.align ?? 'start'], width[column.width ?? 'normal'])}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{renderBody(state, columns, colCount, rowKey, emptyLabel, loadingLabel, onRowClick)}</tbody>
      </table>
    </div>
  )
}

function renderBody<T>(
  state: DataTableState<T>,
  columns: readonly Column<T>[],
  colCount: number,
  rowKey: (row: T) => string,
  emptyLabel: string,
  loadingLabel: string,
  onRowClick?: (row: T) => void,
): ReactNode {
  switch (state.status) {
    case 'loading':
      return (
        <tr>
          <td colSpan={colCount} className={stateCell} role="status">
            {loadingLabel}
          </td>
        </tr>
      )
    case 'error':
      return (
        <tr>
          <td colSpan={colCount} className={errorCell}>
            {state.message}
          </td>
        </tr>
      )
    case 'ready':
      if (state.rows.length === 0) {
        return (
          <tr>
            <td colSpan={colCount} className={stateCell}>
              {emptyLabel}
            </td>
          </tr>
        )
      }
      return state.rows.map((row) => (
        <tr
          key={rowKey(row)}
          className={onRowClick !== undefined ? clickableRow : undefined}
          {...(onRowClick !== undefined
            ? {
                role: 'button' as const,
                tabIndex: 0,
                onClick: () => { onRowClick(row); },
                onKeyDown: (e: KeyboardEvent<HTMLTableRowElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onRowClick(row)
                  }
                },
              }
            : {})}
        >
          {columns.map((column) => (
            <td key={column.key} className={cx(td, align[column.align ?? 'start'])}>
              {column.cell(row)}
            </td>
          ))}
        </tr>
      ))
    default: {
      const _exhaustive: never = state
      return _exhaustive
    }
  }
}
