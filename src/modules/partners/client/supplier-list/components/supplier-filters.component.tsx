import type { ReactNode } from 'react'
import { useState } from 'react'

import { Input, FilterIcon, ChevronDownIcon, ChevronUpIcon } from '#shared/ui/index.ts'

import { useDebouncedSearch } from './supplier-filters.controller.ts'
import {
  toolbar,
  toolbarRow,
  search,
  funnelButton,
  funnelButtonActive,
  counterChip,
  panel,
  advancedHeader,
  funnelBadge,
  headerTexts,
  advancedTitle,
  advancedSubtitle,
  collapseButton,
  clearAllButton,
  chipsRow,
  appliedChip,
  appliedChipRemove,
  chipsSpacer,
  groupGrid,
  field,
  fieldLabel,
  select,
  group,
  chip,
  chipActive,
  panelFooter,
  footerRight,
  applyButton,
  clearButton,
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
    statusLabel: string
    advancedTitle: string
    advancedSubtitle: string
    collapse: string
    clear: string
    clearAll: string
    removeFilter: string
    applied: string
  }>
  /** Slot de exportação (a página injeta o dropdown CSV/PDF com os dados carregados). */
  exportSlot?: ReactNode
  onSearch: (value: string) => void
  onStatus: (status: StatusFilter) => void
  onCategory: (category: string) => void
  onClear: () => void
  onClearAll: () => void
}>

const STATUSES: readonly StatusFilter[] = ['all', 'active', 'inactive']

type AppliedChip = Readonly<{ key: string; label: string; onRemove: () => void }>

function XIcon(): ReactNode {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
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

  const appliedChips: readonly AppliedChip[] = [
    props.status !== 'all'
      ? { key: 'status', label: `${L.statusLabel}: ${props.status === 'active' ? L.active : L.inactive}`, onRemove: () => { props.onStatus('all'); } }
      : null,
    props.category !== ''
      ? { key: 'category', label: `${L.category}: ${props.category}`, onRemove: () => { props.onCategory(''); } }
      : null,
  ].filter((c): c is AppliedChip => c !== null)

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
          <FilterIcon size={16} />
        </button>
        <div className={search}>
          <Input id="supplier-search" value={searchField.value} placeholder={L.search} onChange={searchField.setValue} />
        </div>
        {appliedChips.length > 0 ? (
          <button type="button" className={counterChip} onClick={() => { setOpen((v) => !v); }}>
            {`${String(appliedChips.length)} ${L.applied}`}
            {open ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
          </button>
        ) : null}
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

      {appliedChips.length > 0 ? (
        <div className={chipsRow}>
          {appliedChips.map((c) => (
            <span key={c.key} className={appliedChip}>
              {c.label}
              <button type="button" className={appliedChipRemove} aria-label={`${L.removeFilter}: ${c.label}`} onClick={c.onRemove}>
                <XIcon />
              </button>
            </span>
          ))}
          <span className={chipsSpacer} aria-hidden="true" />
          <button type="button" className={clearAllButton} onClick={() => { props.onClearAll(); }}>
            {L.clearAll}
          </button>
        </div>
      ) : null}

      {open ? (
        <div className={panel}>
          <div className={advancedHeader}>
            <span className={funnelBadge}><FilterIcon size={18} /></span>
            <div className={headerTexts}>
              <h3 className={advancedTitle}>{L.advancedTitle}</h3>
              <p className={advancedSubtitle}>{L.advancedSubtitle}</p>
            </div>
            <button type="button" className={collapseButton} onClick={() => { setOpen(false); }}>
              {L.collapse}
              <ChevronUpIcon size={14} />
            </button>
          </div>

          <div className={groupGrid}>
            {/* Status de contrato: filtro sem suporte no backend (placeholder desabilitado). */}
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
          </div>

          <div className={panelFooter}>
            <button type="button" className={clearButton} onClick={() => { props.onClear(); }}>
              {L.clear}
            </button>
            <div className={footerRight}>
              <button type="button" className={applyButton} onClick={() => { setOpen(false); }}>
                {L.apply}
              </button>
              {props.exportSlot}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
