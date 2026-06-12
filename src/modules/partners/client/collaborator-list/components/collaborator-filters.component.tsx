import type { ReactNode } from 'react'
import { useState } from 'react'

import {
  Input,
  FilterIcon,
  UsersIcon,
  FileTextIcon,
  LinkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '#shared/ui/index.ts'

import { useDebouncedSearch } from './collaborator-filters.controller.ts'
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
  groupSection,
  groupHeader,
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
    advancedTitle: string
    advancedSubtitle: string
    collapse: string
    clear: string
    groupPessoais: string
    groupContratuais: string
    groupSituacao: string
    applied: string
    statusLabel: string
    clearAll: string
    removeFilter: string
  }>
  /** Slot de exportação (a página injeta o dropdown Tudo/Histórico/template). */
  exportSlot?: ReactNode
  onSearch: (value: string) => void
  onStatus: (status: StatusFilter) => void
  onSituacao: (situacao: SituacaoFilter) => void
  onEmployment: (employment: string) => void
  onRole: (role: string) => void
  onYear: (year: string) => void
  /** Limpa os filtros avançados do painel (não toca em status/busca). Front-only, sem backend. */
  onClear: () => void
  /** Limpa TODOS os filtros aplicados (chips), inclusive status. Front-only, sem backend. */
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

  // Chips dos filtros APLICADOS (display + remoção individual). Derivado puro do estado da URL —
  // só os filtros com suporte real no front (os gated nunca entram aqui).
  const situacaoLabel =
    props.situacao === 'pre-registration' ? L.preRegistration : props.situacao === 'complete' ? L.complete : ''
  const employmentLabel = props.employmentOptions.find((o) => o.value === props.employment)?.label ?? props.employment

  const appliedChips: readonly AppliedChip[] = [
    props.status !== 'all'
      ? { key: 'status', label: `${L.statusLabel}: ${props.status === 'active' ? L.active : L.inactive}`, onRemove: () => { props.onStatus('all'); } }
      : null,
    props.year.trim() !== ''
      ? { key: 'year', label: `${L.year}: ${props.year}`, onRemove: () => { props.onYear(''); } }
      : null,
    props.role.trim() !== ''
      ? { key: 'role', label: `${L.role}: ${props.role}`, onRemove: () => { props.onRole(''); } }
      : null,
    props.situacao !== ''
      ? { key: 'situacao', label: `${L.situacao}: ${situacaoLabel}`, onRemove: () => { props.onSituacao(''); } }
      : null,
    props.employment !== ''
      ? { key: 'employment', label: `${L.employment}: ${employmentLabel}`, onRemove: () => { props.onEmployment(''); } }
      : null,
  ].filter((c): c is AppliedChip => c !== null)

  const appliedCount = appliedChips.length

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
          <Input
            id="collaborator-search"
            value={searchField.value}
            placeholder={L.search}
            onChange={searchField.setValue}
          />
        </div>
        {appliedCount > 0 ? (
          <button type="button" className={counterChip} onClick={() => { setOpen((v) => !v); }}>
            {`${String(appliedCount)} ${L.applied}`}
            {open ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
          </button>
        ) : null}
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

          {/* Dados Pessoais — todos gated (sem suporte no backend; ver gaps). */}
          <div className={groupSection}>
            <span className={groupHeader}><UsersIcon size={16} />{L.groupPessoais}</span>
            <div className={groupGrid}>
              <GatedSelect label={L.escolaridade} allOption={L.allOption} hint={L.gatedHint} />
              <GatedSelect label={L.raca} allOption={L.allOption} hint={L.gatedHint} />
              <GatedSelect label={L.idade} allOption={L.allOption} hint={L.gatedHint} />
              <GatedSelect label={L.genderIdentity} allOption={L.allOption} hint={L.gatedHint} />
            </div>
          </div>

          {/* Dados Contratuais. */}
          <div className={groupSection}>
            <span className={groupHeader}><FileTextIcon size={16} />{L.groupContratuais}</span>
            <div className={groupGrid}>
              <div className={field}>
                <label className={fieldLabel} htmlFor="collab-f-year">{L.year}</label>
                <Input id="collab-f-year" type="number" value={props.year} placeholder={L.year} onChange={props.onYear} />
              </div>
              <div className={field}>
                <label className={fieldLabel} htmlFor="collab-f-role">{L.role}</label>
                <Input id="collab-f-role" value={props.role} placeholder={L.role} onChange={props.onRole} />
              </div>
              <GatedSelect label={L.programa} allOption={L.allOption} hint={L.gatedHint} />
            </div>
          </div>

          {/* Situação. */}
          <div className={groupSection}>
            <span className={groupHeader}><LinkIcon size={16} />{L.groupSituacao}</span>
            <div className={groupGrid}>
              <div className={field}>
                <label className={fieldLabel} htmlFor="collab-f-situacao">{L.situacao}</label>
                <select id="collab-f-situacao" className={select} value={props.situacao} onChange={(e) => { props.onSituacao(e.target.value as SituacaoFilter); }}>
                  <option value="">{L.allOption}</option>
                  <option value="pre-registration">{L.preRegistration}</option>
                  <option value="complete">{L.complete}</option>
                </select>
              </div>
              <div className={field}>
                <label className={fieldLabel} htmlFor="collab-f-vinc">{L.employment}</label>
                <select id="collab-f-vinc" className={select} value={props.employment} onChange={(e) => { props.onEmployment(e.target.value); }}>
                  <option value="">{L.allOption}</option>
                  {props.employmentOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <GatedSelect label={L.deactivatedBy} allOption={L.allOption} hint={L.gatedHint} />
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
