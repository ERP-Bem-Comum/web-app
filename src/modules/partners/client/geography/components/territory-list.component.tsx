import type { ReactNode } from 'react'

import { Checkbox } from '#shared/ui/index.ts'

import { label, labelStatic, list, message, row, rowSelected } from './territory-list.css.ts'

export type TerritoryListItem = Readonly<{ key: string; label: string; checked: boolean }>

export type TerritoryListProps = Readonly<{
  items: readonly TerritoryListItem[]
  toggleAria: string
  toggleDisabled: boolean
  emptyLabel: string
  onToggle: (key: string, checked: boolean) => void
  /** Quando dado, o rótulo vira um botão que seleciona o item (ex.: escolher o UF). */
  onSelect?: (key: string) => void
  selectedKey?: string | null
}>

/**
 * TerritoryList — componente BURRO (§XI): lista de territórios com um Checkbox de parceria cada.
 * Opcionalmente o rótulo é selecionável (para escolher um estado e carregar seus municípios).
 */
export function TerritoryList(props: TerritoryListProps): ReactNode {
  if (props.items.length === 0) {
    return <p className={message}>{props.emptyLabel}</p>
  }
  return (
    <ul className={list}>
      {props.items.map((item) => {
        const selected = props.selectedKey === item.key
        return (
          <li key={item.key} className={selected ? rowSelected : row}>
            {props.onSelect !== undefined ? (
              <button
                type="button"
                className={label}
                aria-pressed={selected}
                onClick={() => {
                  props.onSelect?.(item.key)
                }}
              >
                {item.label}
              </button>
            ) : (
              <span className={labelStatic}>{item.label}</span>
            )}
            <Checkbox
              id={`territory-${item.key}`}
              checked={item.checked}
              disabled={props.toggleDisabled}
              onChange={(checked) => {
                props.onToggle(item.key, checked)
              }}
            />
          </li>
        )
      })}
    </ul>
  )
}
