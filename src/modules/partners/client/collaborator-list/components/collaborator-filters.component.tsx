import type { ReactNode } from 'react'
import { useState } from 'react'

import { Input } from '#shared/ui/index.ts'

import { useDebouncedSearch } from './collaborator-filters.controller.ts'
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
} from './collaborator-filters.css.ts'

export type StatusFilter = 'all' | 'active' | 'inactive'
export type SituacaoFilter = '' | 'pre-registration' | 'complete'

export type SelectOption = Readonly<{ value: string; label: string }>

export type CollaboratorFiltersProps = Readonly<{
  searchValue: string
  status: StatusFilter
  situacao: SituacaoFilter
  employment: string
  role: string
  year: string
  employmentOptions: readonly SelectOption[]
  labels: Readonly<{
    search: string
    all: string
    active: string
    inactive: string
    toggle: string
    situacao: string
    employment: string
    role: string
    year: string
    escolaridade: string
    raca: string
    idade: string
    genderIdentity: string
    programa: string
    deactivatedBy: string
    gatedHint: string
    allOption: string
    preRegistration: string
    complete: string
    apply: string
    export: string
  }>
  onSearch: (value: string) => void
  onStatus: (status: StatusFilter) => void
  onSituacao: (situacao: SituacaoFilter) => void
  onEmployment: (employment: string) => void
  onRole: (role: string) => void
  onYear: (year: string) => void
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

/** Filtro ainda sem suporte no backend (ver PAR-COLLABORATOR-GRID-GAPS): visível mas desabilitado. */
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

export function CollaboratorFilters(props: CollaboratorFiltersProps): ReactNode {
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
            id="collaborator-search"
            value={searchField.value}
            placeholder={L.search}
            onChange={searchField.setValue}
          />
        </div>
        {/* Status (Todos/Ativos/Inativos) FORA do painel de filtros. */}
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
          {/* Filtros do print sem suporte no backend (placeholders desabilitados — ver gaps). */}
          <GatedSelect label={L.escolaridade} allOption={L.allOption} hint={L.gatedHint} />
          <GatedSelect label={L.raca} allOption={L.allOption} hint={L.gatedHint} />

          <div className={field}>
            <label className={fieldLabel} htmlFor="collab-f-year">{L.year}</label>
            <Input id="collab-f-year" type="number" value={props.year} placeholder={L.year} onChange={props.onYear} />
          </div>

          <GatedSelect label={L.deactivatedBy} allOption={L.allOption} hint={L.gatedHint} />
          <GatedSelect label={L.programa} allOption={L.allOption} hint={L.gatedHint} />

          <div className={field}>
            <label className={fieldLabel} htmlFor="collab-f-role">{L.role}</label>
            <Input id="collab-f-role" value={props.role} placeholder={L.role} onChange={props.onRole} />
          </div>

          <GatedSelect label={L.genderIdentity} allOption={L.allOption} hint={L.gatedHint} />

          <div className={field}>
            <label className={fieldLabel} htmlFor="collab-f-situacao">{L.situacao}</label>
            <select id="collab-f-situacao" className={select} value={props.situacao} onChange={(e) => { props.onSituacao(e.target.value as SituacaoFilter); }}>
              <option value="">{L.allOption}</option>
              <option value="pre-registration">{L.preRegistration}</option>
              <option value="complete">{L.complete}</option>
            </select>
          </div>

          <GatedSelect label={L.idade} allOption={L.allOption} hint={L.gatedHint} />

          <div className={field}>
            <label className={fieldLabel} htmlFor="collab-f-vinc">{L.employment}</label>
            <select id="collab-f-vinc" className={select} value={props.employment} onChange={(e) => { props.onEmployment(e.target.value); }}>
              <option value="">{L.allOption}</option>
              {props.employmentOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
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
