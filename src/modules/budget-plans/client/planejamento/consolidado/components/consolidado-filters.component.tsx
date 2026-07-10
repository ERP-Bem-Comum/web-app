import { useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { ChevronDownIcon, FilterIcon, DownloadIcon } from '#shared/ui/index.ts'

import {
  bar,
  fieldWrap,
  fieldLabel,
  selectWrap,
  selectChevron,
  select,
  applyButton,
  exportButton,
  buttonIcon,
} from './consolidado-filters.css.ts'

const t = createTranslator(ptBR)

export type ConsolidadoFiltersLabels = Readonly<{
  yearBase: string
  programs: string
  apply: string
  exportCsv: string
}>

/** Opção de programa: valor = uuid (`ref`); rótulo exibido = abreviação (`label`). */
export type ConsolidadoProgramOption = Readonly<{ ref: string; label: string }>

export type ConsolidadoFiltersValue = Readonly<{
  year: number
  programRef?: string
}>

export type ConsolidadoFiltersProps = Readonly<{
  value: ConsolidadoFiltersValue
  years: readonly number[]
  programOptions: readonly ConsolidadoProgramOption[]
  labels: ConsolidadoFiltersLabels
  /** Export CSV em andamento — desabilita o botão (o BFF repassa o arquivo do core-api). */
  exporting?: boolean
  onApply: (value: ConsolidadoFiltersValue) => void
  onExport: () => void
}>

/**
 * Barra de filtros do Consolidado ABC (view BURRA §2): Ano Base (dropdown) + Programa (dropdown SINGLE-select
 * por `ref`; "" = Todos) + "Filtrar"; à direita "Exportar CSV". Estado local até "Filtrar"; a URL é a fonte de
 * verdade (recebida por `value`). O endpoint real filtra por UM programa (uuid), então o valor emitido é o
 * `programRef` (ou `undefined` = Todos).
 */
export function ConsolidadoFilters(props: ConsolidadoFiltersProps): ReactNode {
  const [year, setYear] = useState<number>(props.value.year)
  const [program, setProgram] = useState<string>(props.value.programRef ?? '')

  return (
    <div className={bar}>
      <div className={fieldWrap}>
        <span className={fieldLabel}>{props.labels.yearBase}</span>
        <span className={selectWrap}>
          <select
            className={select}
            value={String(year)}
            aria-label={props.labels.yearBase}
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
          <span className={selectChevron} aria-hidden="true">
            <ChevronDownIcon size={16} />
          </span>
        </span>
      </div>

      <div className={fieldWrap}>
        <span className={fieldLabel}>{props.labels.programs}</span>
        <span className={selectWrap}>
          <select
            className={select}
            value={program}
            aria-label={props.labels.programs}
            onChange={(e) => {
              setProgram(e.target.value)
            }}
          >
            <option value="">{t('budget-plans.consolidado.programsAll')}</option>
            {props.programOptions.map((p) => (
              <option key={p.ref} value={p.ref}>
                {p.label}
              </option>
            ))}
          </select>
          <span className={selectChevron} aria-hidden="true">
            <ChevronDownIcon size={16} />
          </span>
        </span>
      </div>

      <button
        type="button"
        className={applyButton}
        onClick={() => {
          props.onApply({ year, programRef: program === '' ? undefined : program })
        }}
      >
        <span className={buttonIcon} aria-hidden="true">
          <FilterIcon size={15} />
        </span>
        {props.labels.apply}
      </button>

      <button
        type="button"
        className={exportButton}
        onClick={props.onExport}
        disabled={props.exporting === true}
      >
        <span className={buttonIcon} aria-hidden="true">
          <DownloadIcon size={15} />
        </span>
        {props.labels.exportCsv}
      </button>
    </div>
  )
}
