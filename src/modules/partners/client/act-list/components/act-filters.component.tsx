import type { ReactNode } from 'react'
import { useState } from 'react'

import { Input } from '#shared/ui/index.ts'

import { useDebouncedSearch } from './act-filters.controller.ts'
import {
  toolbar,
  toolbarRow,
  search,
  funnelButton,
  funnelButtonActive,
  panel,
  field,
  fieldLabel,
  select,
  group,
  chip,
  chipActive,
  panelFooter,
  applyButton,
} from './act-filters.css.ts'

export type StatusFilter = 'all' | 'active' | 'inactive'

/** Filtro de repasse financeiro: todos | com | sem. */
export type TransferFilter = 'all' | 'yes' | 'no'

export type SelectOption = Readonly<{ value: string; label: string }>

export type ActFiltersProps = Readonly<{
  searchValue: string
  status: StatusFilter
  transfer: TransferFilter
  area: string
  areaOptions: readonly SelectOption[]
  labels: Readonly<{
    search: string
    all: string
    active: string
    inactive: string
    toggle: string
    hasTransfer: string
    transferYes: string
    transferNo: string
    area: string
    allOption: string
    apply: string
  }>
  /** Slot de exportação (a página injeta o dropdown CSV/PDF com os dados carregados). */
  exportSlot?: ReactNode
  onSearch: (value: string) => void
  onStatus: (status: StatusFilter) => void
  onTransfer: (transfer: TransferFilter) => void
  onArea: (area: string) => void
}>

const STATUSES: readonly StatusFilter[] = ['all', 'active', 'inactive']

function FunnelIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h12l-4.5 5.5V13L6.5 11.5V8.5L2 3z" />
    </svg>
  )
}

export function ActFilters(props: ActFiltersProps): ReactNode {
  const searchField = useDebouncedSearch(props.searchValue, props.onSearch)
  const [open, setOpen] = useState(false)
  const L = props.labels

  return (
    <div className={toolbar}>
      <div className={toolbarRow}>
        <button
          type="button"
          className={open ? funnelButtonActive : funnelButton}
          aria-pressed={open}
          aria-label={L.toggle}
          title={L.toggle}
          onClick={() => { setOpen((v) => !v); }}
        >
          <FunnelIcon />
        </button>
        <div className={search}>
          <Input id="act-search" value={searchField.value} placeholder={L.search} onChange={searchField.setValue} />
        </div>
        <div className={group} role="group" aria-label={L.all}>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={props.status === s ? chipActive : chip}
              aria-pressed={props.status === s}
              onClick={() => { props.onStatus(s); }}
            >
              {L[s]}
            </button>
          ))}
        </div>
      </div>

      {open ? (
        <div className={panel}>
          <div className={field}>
            <label className={fieldLabel} htmlFor="act-f-transfer">{L.hasTransfer}</label>
            <select
              id="act-f-transfer"
              className={select}
              value={props.transfer}
              onChange={(e) => {
                const v = e.target.value
                props.onTransfer(v === 'yes' ? 'yes' : v === 'no' ? 'no' : 'all')
              }}
            >
              <option value="all">{L.allOption}</option>
              <option value="yes">{L.transferYes}</option>
              <option value="no">{L.transferNo}</option>
            </select>
          </div>

          <div className={field}>
            <label className={fieldLabel} htmlFor="act-f-area">{L.area}</label>
            <select
              id="act-f-area"
              className={select}
              value={props.area}
              onChange={(e) => { props.onArea(e.target.value); }}
            >
              <option value="">{L.allOption}</option>
              {props.areaOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className={panelFooter}>
            <button type="button" className={applyButton} onClick={() => { setOpen(false); }}>{L.apply}</button>
            {props.exportSlot}
          </div>
        </div>
      ) : null}
    </div>
  )
}
