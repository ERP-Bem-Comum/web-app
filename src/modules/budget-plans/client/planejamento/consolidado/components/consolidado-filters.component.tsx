import { useState, type ReactNode } from 'react'

import {
  bar,
  fieldWrap,
  fieldLabel,
  select,
  programChips,
  chip,
  chipActive,
  spacer,
  applyButton,
  exportButton,
} from './consolidado-filters.css.ts'

export type ConsolidadoFiltersLabels = Readonly<{
  yearBase: string
  programs: string
  apply: string
  exportExcel: string
}>

export type ConsolidadoFiltersValue = Readonly<{
  year: number
  programs: readonly string[]
}>

export type ConsolidadoFiltersProps = Readonly<{
  value: ConsolidadoFiltersValue
  years: readonly number[]
  programOptions: readonly string[]
  labels: ConsolidadoFiltersLabels
  onApply: (value: ConsolidadoFiltersValue) => void
  onExport: () => void
}>

/**
 * Barra de filtros do Consolidado ABC (view BURRA §2): Ano Base (dropdown) + Programa(s) (multi-seleção por
 * chips) + "Filtrar"; à direita "Exportar Excel/CSV". Estado local até "Filtrar"; a URL é a fonte de verdade
 * (recebida por `value`).
 */
export function ConsolidadoFilters(props: ConsolidadoFiltersProps): ReactNode {
  const [year, setYear] = useState<number>(props.value.year)
  const [programs, setPrograms] = useState<readonly string[]>(props.value.programs)

  const toggleProgram = (p: string): void => {
    setPrograms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  return (
    <div className={bar}>
      <label className={fieldWrap}>
        <span className={fieldLabel}>{props.labels.yearBase}</span>
        <select
          className={select}
          value={String(year)}
          onChange={(e) => {
            setYear(Number(e.target.value))
          }}
        >
          {props.years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </label>

      <div className={fieldWrap}>
        <span className={fieldLabel}>{props.labels.programs}</span>
        <div className={programChips} role="group" aria-label={props.labels.programs}>
          {props.programOptions.map((p) => {
            const on = programs.includes(p)
            return (
              <button
                key={p}
                type="button"
                className={on ? chipActive : chip}
                aria-pressed={on}
                onClick={() => {
                  toggleProgram(p)
                }}
              >
                {p}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        className={applyButton}
        onClick={() => {
          props.onApply({ year, programs })
        }}
      >
        {props.labels.apply}
      </button>

      <span className={spacer} />

      <button type="button" className={exportButton} onClick={props.onExport}>
        {props.labels.exportExcel}
      </button>
    </div>
  )
}
