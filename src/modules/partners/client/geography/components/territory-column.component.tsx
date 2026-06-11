import type { ReactNode } from 'react'

import { Input } from '#shared/ui/index.ts'

import {
  card,
  header,
  title,
  count,
  tableHead,
  list,
  row,
  label,
  addedText,
  addButton,
  removeButton,
  message,
} from './territory-column.css.ts'

export type ColumnItem = Readonly<{ key: string; label: string; added: boolean }>

export type ColumnState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; message: string }>
  | Readonly<{ status: 'ready'; items: readonly ColumnItem[] }>

export type TerritoryColumnProps = Readonly<{
  title: string
  countLabel?: string | null
  /** Conteúdo acima da busca (ex.: o select de UF na Lista Geral de Municípios). */
  beforeSearch?: ReactNode
  searchId: string
  searchValue: string
  searchPlaceholder: string
  onSearch: (value: string) => void
  columnLabel: string
  actionLabel: string
  /** add: adicionados viram texto "Adicionado". remove: sempre −. toggle: + se não, − se adicionado. */
  mode: 'add' | 'remove' | 'toggle'
  state: ColumnState
  emptyLabel: string
  addedLabel: string
  addAria: string
  removeAria: string
  disabled: boolean
  onAction: (key: string, added: boolean) => void
  loadingLabel: string
  /** Quando definido, exibe só esta mensagem (sem busca/tabela) — ex.: painel pendente de backend. */
  placeholder?: string
}>

function PlusIcon(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M7 3v8M3 7h8" />
    </svg>
  )
}

function MinusIcon(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M3 7h8" />
    </svg>
  )
}

export function TerritoryColumn(props: TerritoryColumnProps): ReactNode {
  return (
    <section className={card}>
      <div className={header}>
        <h3 className={title}>{props.title}</h3>
        {props.countLabel !== undefined && props.countLabel !== null ? (
          <span className={count}>{props.countLabel}</span>
        ) : null}
      </div>

      {props.placeholder !== undefined ? (
        <p className={message}>{props.placeholder}</p>
      ) : (
        <>
          {props.beforeSearch}
          <Input
            id={props.searchId}
            value={props.searchValue}
            placeholder={props.searchPlaceholder}
            onChange={props.onSearch}
          />
          <div className={tableHead}>
            <span>{props.columnLabel}</span>
            <span>{props.actionLabel}</span>
          </div>
          <Body {...props} />
        </>
      )}
    </section>
  )
}

function Body(props: TerritoryColumnProps): ReactNode {
  switch (props.state.status) {
    case 'loading':
      return <p className={message}>{props.loadingLabel}</p>
    case 'error':
      return <p className={message}>{props.state.message}</p>
    case 'ready': {
      const items = props.state.items
      if (items.length === 0) return <p className={message}>{props.emptyLabel}</p>
      return (
        <ul className={list}>
          {items.map((item) => {
            const showAddedText = props.mode === 'add' && item.added
            const showRemove = props.mode === 'remove' || (props.mode === 'toggle' && item.added)
            return (
              <li key={item.key} className={row}>
                <span className={label}>{item.label}</span>
                {showAddedText ? (
                  <span className={addedText}>{props.addedLabel}</span>
                ) : showRemove ? (
                  <button
                    type="button"
                    className={removeButton}
                    aria-label={props.removeAria}
                    title={props.removeAria}
                    disabled={props.disabled}
                    onClick={() => { props.onAction(item.key, true); }}
                  >
                    <MinusIcon />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={addButton}
                    aria-label={props.addAria}
                    title={props.addAria}
                    disabled={props.disabled}
                    onClick={() => { props.onAction(item.key, false); }}
                  >
                    <PlusIcon />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )
    }
    default: {
      const _exhaustive: never = props.state
      return _exhaustive
    }
  }
}
