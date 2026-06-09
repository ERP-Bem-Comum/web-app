import type { ReactNode } from 'react'
import { useState } from 'react'

import { Input } from '#shared/ui/index.ts'

import { useDebouncedSearch } from './supplier-filters.controller.ts'
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
} from './supplier-filters.css.ts'

export type StatusFilter = 'all' | 'active' | 'inactive'

export type SupplierFiltersProps = Readonly<{
  searchValue: string
  status: StatusFilter
  category: string
  categories: readonly string[]
  labels: Readonly<{
    search: string
    all: string
    active: string
    inactive: string
    toggle: string
    category: string
    contractStatus: string
    allOption: string
    gatedHint: string
    apply: string
    export: string
  }>
  onSearch: (value: string) => void
  onStatus: (status: StatusFilter) => void
  onCategory: (category: string) => void
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

/** Filtro ainda sem suporte no backend: visível mas desabilitado (mesmo padrão de Colaboradores). */
function GatedSelect({ label, allOption, hint }: { label: string; allOption: string; hint: string }): ReactNode {
  return (
    <div className={field}>
      <span className={fieldLabel}>{label}</span>
      <select className={select} disabled title={hint} aria-label={label}>
        <option>{allOption}</option>
      </select>
    </div>
  )
}

export function SupplierFilters(props: SupplierFiltersProps): ReactNode {
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
          <Input
            id="supplier-search"
            value={searchField.value}
            placeholder={L.search}
            onChange={searchField.setValue}
          />
        </div>
        {/* Status do fornecedor (Todos/Ativos/Inativos) — fora do painel, igual Colaboradores. */}
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
          {/* Status de contrato: filtro do print sem suporte no backend (placeholder desabilitado). */}
          <GatedSelect label={L.contractStatus} allOption={L.allOption} hint={L.gatedHint} />

          <div className={field}>
            <label className={fieldLabel} htmlFor="supplier-f-category">{L.category}</label>
            <select
              id="supplier-f-category"
              className={select}
              value={props.category}
              onChange={(e) => { props.onCategory(e.target.value); }}
            >
              <option value="">{L.allOption}</option>
              {props.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className={panelFooter}>
            <button type="button" className={applyButton} onClick={() => { setOpen(false); }}>
              {L.apply}
            </button>
            <button type="button" className={exportButton} onClick={props.onExport}>
              {L.export}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
