/**
 * BrandDataTable — tabela reutilizável da identidade de grid "brand" (mock colaboradores-brand). Mesma API
 * do DataTable (colunas + estado + rowKey + onRowClick), mas com o visual novo (cartão, thead uppercase,
 * hover, scrollbar). As PROPORÇÕES das colunas vêm por `gridTemplate` (cada grid passa o seu). BrandChip e
 * BrandAvatar acompanham (usados nas `cell` de cada grid). View burra.
 */
import type { KeyboardEvent, ReactNode } from 'react'

import {
  card,
  thead,
  row,
  rowClickable,
  cell,
  personCell,
  nameText,
  avatar as avatarClass,
  avatarLogo,
  avatarPlaceholder,
  stateRow,
  errorRow,
  chip,
  dot,
  chipTone,
  dotTone,
} from './brand-data-table.css.ts'

export type BrandColumn<T> = Readonly<{
  key: string
  header: string
  cell: (row: T) => ReactNode
}>

export type BrandTableState<T> =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; message: string }>
  | Readonly<{ status: 'ready'; rows: readonly T[] }>

export type BrandDataTableProps<T> = Readonly<{
  columns: readonly BrandColumn<T>[]
  /** grid-template-columns (proporções por grid), aplicado no thead e nas linhas. */
  gridTemplate: string
  state: BrandTableState<T>
  rowKey: (row: T) => string
  caption: string
  emptyLabel: string
  loadingLabel: string
  onRowClick?: (row: T) => void
}>

export function BrandDataTable<T>(props: BrandDataTableProps<T>): ReactNode {
  const cols = { gridTemplateColumns: props.gridTemplate }

  return (
    <div className={card} role="table" aria-label={props.caption}>
      <div className={thead} role="row" style={cols}>
        {props.columns.map((c) => (
          <div key={c.key} role="columnheader">
            {c.header}
          </div>
        ))}
      </div>

      <div role="rowgroup">
        {props.state.status === 'loading' ? (
          <div className={stateRow} role="status">
            {props.loadingLabel}
          </div>
        ) : props.state.status === 'error' ? (
          <div className={errorRow} role="alert">
            {props.state.message}
          </div>
        ) : props.state.rows.length === 0 ? (
          <div className={stateRow}>{props.emptyLabel}</div>
        ) : (
          props.state.rows.map((r) => {
            const activate = props.onRowClick
            return (
              <div
                key={props.rowKey(r)}
                className={activate !== undefined ? `${row} ${rowClickable}` : row}
                role="row"
                style={cols}
                {...(activate !== undefined
                  ? {
                      tabIndex: 0,
                      onClick: () => {
                        activate(r)
                      },
                      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          activate(r)
                        }
                      },
                    }
                  : {})}
              >
                {props.columns.map((c) => (
                  <div key={c.key} role="cell" className={cell}>
                    {c.cell(r)}
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export type BrandChipTone = 'ok' | 'danger' | 'cad' | 'warn'

export function BrandChip(props: Readonly<{ tone: BrandChipTone; label: string }>): ReactNode {
  return (
    <span className={`${chip} ${chipTone[props.tone]}`}>
      <span className={`${dot} ${dotTone[props.tone]}`} aria-hidden="true" />
      {props.label}
    </span>
  )
}

/**
 * Avatar do nome: iniciais tingidas (cor por grid via `bg`/`fg`, que são valores de token passados pela
 * page) OU logo real (Programas). `name` é o texto ao lado.
 */
export function BrandNameCell(
  props: Readonly<{
    name: string
    initials: string
    bg?: string
    fg?: string
    logoUrl?: string | null
  }>,
): ReactNode {
  return (
    <div className={personCell}>
      {props.logoUrl !== undefined && props.logoUrl !== null && props.logoUrl !== '' ? (
        <img className={avatarLogo} src={props.logoUrl} alt="" aria-hidden="true" />
      ) : props.bg !== undefined ? (
        <span className={avatarClass} aria-hidden="true" style={{ background: props.bg, color: props.fg }}>
          {props.initials}
        </span>
      ) : (
        <span className={avatarPlaceholder} aria-hidden="true">
          {props.initials}
        </span>
      )}
      <span className={nameText}>{props.name}</span>
    </div>
  )
}
