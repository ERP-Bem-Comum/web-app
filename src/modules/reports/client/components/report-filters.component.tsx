/**
 * ReportFilters — barra de filtros (identidade "brand") do relatório "Fornecedores sem Contrato". View
 * BURRA: recebe labels + o valor/handler do **Limite** (único campo ligado à tela — dirige a matemática) e
 * um slot de exportação. Os demais campos (Programa, Plano Orçamentário, Período, Centro/Categoria/
 * Subcategoria de custo) são PLACEHOLDERS visuais (selects/date nativos sem fonte de dados — core-api#114
 * ainda não existe). O botão Filtrar é visual (front-first). Espelha o painel avançado do filtro de
 * Colaboradores.
 */
import type { ReactNode } from 'react'

import { FilterIcon } from '#shared/ui/index.ts'

import {
  panel,
  advancedHeader,
  funnelBadge,
  headerTexts,
  advancedTitle,
  advancedSubtitle,
  groupSection,
  groupHeader,
  groupGrid,
  field,
  fieldLabel,
  select,
  panelFooter,
  footerRight,
  applyButton,
} from './report-filters.css.ts'

export type ReportFiltersLabels = Readonly<{
  advancedTitle: string
  advancedSubtitle: string
  programa: string
  plano: string
  periodo: string
  limite: string
  centro: string
  categoria: string
  subcategoria: string
  allOption: string
  filtrar: string
}>

export type ReportFiltersProps = Readonly<{
  /** Valor do Limite como texto BRL (ex.: "10.000,00"). */
  limiteValue: string
  onLimiteChange: (value: string) => void
  labels: ReportFiltersLabels
  /** Slot de exportação (a page injeta o dropdown CSV/PDF). */
  exportSlot?: ReactNode
}>

/** Campo placeholder (select nativo sem fonte de dados ainda — só a forma/estilo brand). */
function PlaceholderSelect({ label, allOption }: { label: string; allOption: string }): ReactNode {
  return (
    <div className={field}>
      <span className={fieldLabel}>{label}</span>
      <select className={select} aria-label={label} defaultValue="">
        <option value="">{allOption}</option>
      </select>
    </div>
  )
}

export function ReportFilters(props: ReportFiltersProps): ReactNode {
  const L = props.labels

  return (
    <div className={panel}>
      <div className={advancedHeader}>
        <span className={funnelBadge}>
          <FilterIcon size={18} />
        </span>
        <div className={headerTexts}>
          <h3 className={advancedTitle}>{L.advancedTitle}</h3>
          <p className={advancedSubtitle}>{L.advancedSubtitle}</p>
        </div>
      </div>

      <div className={groupSection}>
        <span className={groupHeader}>
          <FilterIcon size={16} />
          {L.advancedTitle}
        </span>
        <div className={groupGrid}>
          <PlaceholderSelect label={L.programa} allOption={L.allOption} />
          <PlaceholderSelect label={L.plano} allOption={L.allOption} />
          {/* Período (date range) — placeholder visual (dois campos de data nativos). */}
          <div className={field}>
            <span className={fieldLabel}>{L.periodo}</span>
            <input className={select} type="date" aria-label={L.periodo} />
          </div>
          {/* Limite — ÚNICO campo ligado à tela (dirige a matemática). Currency como texto. */}
          <div className={field}>
            <label className={fieldLabel} htmlFor="report-limite">
              {L.limite}
            </label>
            <input
              id="report-limite"
              className={select}
              type="text"
              inputMode="decimal"
              value={props.limiteValue}
              onChange={(e) => {
                props.onLimiteChange(e.target.value)
              }}
            />
          </div>
          <PlaceholderSelect label={L.centro} allOption={L.allOption} />
          <PlaceholderSelect label={L.categoria} allOption={L.allOption} />
          <PlaceholderSelect label={L.subcategoria} allOption={L.allOption} />
        </div>
      </div>

      <div className={panelFooter}>
        <span />
        <div className={footerRight}>
          <button type="button" className={applyButton}>
            {L.filtrar}
          </button>
          {props.exportSlot}
        </div>
      </div>
    </div>
  )
}
