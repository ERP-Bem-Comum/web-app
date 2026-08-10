import { useState, type ReactNode } from 'react'

import { FilterIcon, SearchIcon } from '#shared/ui/index.ts'
import type { BudgetPlanStatus } from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

import {
  toolbar,
  toolbarRow,
  funnelButton,
  funnelButtonActive,
  searchWrap,
  searchInput,
  searchIcon,
  spacer,
  createButton,
  panel,
  groupGrid,
  fieldWrap,
  fieldLabel,
  select,
  panelFooter,
  applyButton,
  clearButton,
} from './plan-filters.css.ts'

export type PlanFiltersLabels = Readonly<{
  filterToggle: string
  searchPlaceholder: string
  create: string
  year: string
  program: string
  status: string
  all: string
  apply: string
  clear: string
  statusRascunho: string
  statusEmCalibracao: string
  statusAprovado: string
}>

export type PlanFiltersValue = Readonly<{
  search: string
  year: string
  program: string
  status: '' | BudgetPlanStatus
}>

export type PlanFiltersProps = Readonly<{
  value: PlanFiltersValue
  years: readonly number[]
  programs: readonly string[]
  labels: PlanFiltersLabels
  onSearch: (value: string) => void
  onApply: (value: Omit<PlanFiltersValue, 'search'>) => void
  onClear: () => void
  onCreate: () => void
}>

/**
 * Barra de filtros do Planejamento (view BURRA). Funil (toggle do painel) + busca + "Criar Plano"; o
 * painel expande Ano/Programa/Status + "Filtrar" (§1.1). O estado dos selects é local até "Filtrar"; a
 * busca aplica direto (debounce fica a cargo do binding/rota quando o endpoint existir). Estado da URL
 * é a fonte de verdade (recebido por `value`).
 */
export function PlanFilters(props: PlanFiltersProps): ReactNode {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(props.value.year)
  const [program, setProgram] = useState(props.value.program)
  const [status, setStatus] = useState<'' | BudgetPlanStatus>(props.value.status)

  const statusLabel = (s: BudgetPlanStatus): string =>
    s === 'RASCUNHO'
      ? props.labels.statusRascunho
      : s === 'EM_CALIBRACAO'
        ? props.labels.statusEmCalibracao
        : props.labels.statusAprovado

  return (
    <div className={toolbar}>
      <div className={toolbarRow}>
        <button
          type="button"
          className={open ? funnelButtonActive : funnelButton}
          aria-label={props.labels.filterToggle}
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v)
          }}
        >
          <FilterIcon />
        </button>

        <span className={searchWrap}>
          <span className={searchIcon} aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            className={searchInput}
            type="search"
            value={props.value.search}
            placeholder={props.labels.searchPlaceholder}
            aria-label={props.labels.searchPlaceholder}
            onChange={(e) => {
              props.onSearch(e.target.value)
            }}
          />
        </span>

        <span className={spacer} />

        <button type="button" className={createButton} onClick={props.onCreate}>
          {props.labels.create}
        </button>
      </div>

      {open ? (
        <div className={panel}>
          <div className={groupGrid}>
            <label className={fieldWrap}>
              <span className={fieldLabel}>{props.labels.year}</span>
              <select
                className={select}
                value={year}
                onChange={(e) => {
                  setYear(e.target.value)
                }}
              >
                <option value="">{props.labels.all}</option>
                {props.years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </label>

            <label className={fieldWrap}>
              <span className={fieldLabel}>{props.labels.program}</span>
              <select
                className={select}
                value={program}
                onChange={(e) => {
                  setProgram(e.target.value)
                }}
              >
                <option value="">{props.labels.all}</option>
                {props.programs.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className={fieldWrap}>
              <span className={fieldLabel}>{props.labels.status}</span>
              <select
                className={select}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as '' | BudgetPlanStatus)
                }}
              >
                <option value="">{props.labels.all}</option>
                {(['APROVADO', 'EM_CALIBRACAO', 'RASCUNHO'] as const).map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={panelFooter}>
            <button
              type="button"
              className={clearButton}
              onClick={() => {
                setYear('')
                setProgram('')
                setStatus('')
                props.onClear()
              }}
            >
              {props.labels.clear}
            </button>
            <button
              type="button"
              className={applyButton}
              onClick={() => {
                props.onApply({ year, program, status })
              }}
            >
              {props.labels.apply}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
