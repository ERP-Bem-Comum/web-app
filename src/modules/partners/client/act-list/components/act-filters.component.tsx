import type { ReactNode } from 'react'
import { useState } from 'react'

import { Input, FilterIcon, ChevronDownIcon, ChevronUpIcon } from '#shared/ui/index.ts'

import { useDebouncedSearch } from './act-filters.controller.ts'
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
  onTransfer: (transfer: TransferFilter) => void
  onArea: (area: string) => void
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

export function ActFilters(props: ActFiltersProps): ReactNode {
  const searchField = useDebouncedSearch(props.searchValue, props.onSearch)
  const [open, setOpen] = useState(false)
  const L = props.labels

  const areaLabel = props.areaOptions.find((o) => o.value === props.area)?.label ?? props.area
  const appliedChips: readonly AppliedChip[] = [
    props.status !== 'all'
      ? { key: 'status', label: `${L.statusLabel}: ${props.status === 'active' ? L.active : L.inactive}`, onRemove: () => { props.onStatus('all'); } }
      : null,
    props.transfer !== 'all'
      ? { key: 'transfer', label: `${L.hasTransfer}: ${props.transfer === 'yes' ? L.transferYes : L.transferNo}`, onRemove: () => { props.onTransfer('all'); } }
      : null,
    props.area !== ''
      ? { key: 'area', label: `${L.area}: ${areaLabel}`, onRemove: () => { props.onArea(''); } }
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
          <Input id="act-search" value={searchField.value} placeholder={L.search} onChange={searchField.setValue} />
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
