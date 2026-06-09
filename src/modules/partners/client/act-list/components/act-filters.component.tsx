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
  exportButton,
} from './act-filters.css.ts'

export type StatusFilter = 'all' | 'active' | 'inactive'

export type SelectOption = Readonly<{ value: string; label: string }>

export type ActFiltersProps = Readonly<{
  searchValue: string
  status: StatusFilter
  areaOptions: readonly SelectOption[]
  labels: Readonly<{
    search: string
    all: string
    active: string
    inactive: string
    toggle: string
    tipo: string
    comRepasse: string
    semRepasse: string
    area: string
    allOption: string
    gatedHint: string
    apply: string
    export: string
  }>
  onSearch: (value: string) => void
  onStatus: (status: StatusFilter) => void
  onExport: () => void
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
          {/* Tipo (Com/Sem Repasse): sem suporte no backend ainda → desabilitado (placeholder). */}
          <div className={field}>
            <span className={fieldLabel}>{L.tipo}</span>
            <select className={select} disabled title={L.gatedHint} aria-label={L.tipo}>
              <option value="">{L.allOption}</option>
              <option value="com">{L.comRepasse}</option>
              <option value="sem">{L.semRepasse}</option>
            </select>
          </div>

          {/* Área de Atuação: combo populado; filtro no backend ainda não suportado → desabilitado. */}
          <div className={field}>
            <span className={fieldLabel}>{L.area}</span>
            <select className={select} disabled title={L.gatedHint} aria-label={L.area}>
              <option value="">{L.allOption}</option>
              {props.areaOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className={panelFooter}>
            <button type="button" className={applyButton} onClick={() => { setOpen(false); }}>{L.apply}</button>
            <button type="button" className={exportButton} onClick={props.onExport}>{L.export}</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
