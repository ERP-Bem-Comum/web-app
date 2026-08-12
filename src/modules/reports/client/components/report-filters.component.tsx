/**
 * ReportFilters — barra de filtros do relatório "Fornecedores sem Contrato". View BURRA (§XI): recebe
 * opções/valores/handlers por prop e não guarda estado.
 *
 * Até o #694 este painel era 100% PLACEHOLDER: 5 selects sem fonte de dados (só "Todos"), um campo de data
 * solto e um botão "Filtrar" SEM `onClick` — só o Limite funcionava. O endpoint não aceitava querystring e a
 * resposta não trazia dimensão nenhuma, então não havia o que recortar nem no servidor nem no cliente. Com o
 * #694 os 6 passam a aplicar no SERVIDOR (o `value` é o UUID que vai na query).
 *
 * Divisão de trabalho dos dois tipos de filtro aqui:
 *   • Programa/Plano/Período/Centro/Categoria/Subcategoria → recorte no SERVIDOR, commitado no "Filtrar".
 *   • Limite → matemática CLIENT-SIDE sobre o total do fornecedor; aplica ao digitar (não espera o botão),
 *     porque não custa ida ao servidor e é o campo que a pessoa ajusta procurando o corte certo.
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
  periodRow,
  dateInput,
  panelFooter,
  footerRight,
  applyButton,
  clearButton,
} from './report-filters.css.ts'

export type FilterOption = Readonly<{ value: string; label: string }>

export type ReportFiltersLabels = Readonly<{
  advancedTitle: string
  advancedSubtitle: string
  programa: string
  plano: string
  periodo: string
  periodoDe: string
  periodoAte: string
  limite: string
  centro: string
  categoria: string
  subcategoria: string
  allOption: string
  filtrar: string
  limpar: string
}>

/** Um campo controlado: opções + valor + onChange. `value` vazio = "Todos" (sem recorte). */
export type ReportFilterField = Readonly<{
  options: readonly FilterOption[]
  value: string
  onChange: (v: string) => void
}>

export type ReportFiltersProps = Readonly<{
  labels: ReportFiltersLabels
  /** Valor do Limite como texto BRL (ex.: "10.000,00") — client-side, aplica ao digitar. */
  limiteValue: string
  onLimiteChange: (value: string) => void
  programa: ReportFilterField
  plano: ReportFilterField
  centro: ReportFilterField
  categoria: ReportFilterField
  subcategoria: ReportFilterField
  /** Janela de vencimento em `YYYY-MM-DD`; `dueTo` é EXCLUSIVO no backend. */
  dueFrom: string
  dueTo: string
  onPeriodChange: (patch: Readonly<{ dueFrom?: string; dueTo?: string }>) => void
  /** Commita os filtros de SERVIDOR (o Limite já está aplicado). */
  onFiltrar: () => void
  /** Zera TODOS os campos e aplica na hora — volta a mostrar tudo, sem precisar do "Filtrar". */
  onLimpar: () => void
  /** Slot de exportação (a page injeta o dropdown CSV/PDF). */
  exportSlot?: ReactNode
}>

function Field({
  label,
  placeholder,
  field: f,
}: {
  label: string
  placeholder: string
  field: ReportFilterField
}): ReactNode {
  return (
    <div className={field}>
      <span className={fieldLabel}>{label}</span>
      <select
        className={select}
        aria-label={label}
        value={f.value}
        onChange={(e) => {
          f.onChange(e.target.value)
        }}
      >
        <option value="">{placeholder}</option>
        {f.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
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
          <Field label={L.programa} placeholder={L.allOption} field={props.programa} />
          <Field label={L.plano} placeholder={L.allOption} field={props.plano} />
          {/* Período = DOIS inputs de data (De / Até), como nos demais relatórios; `Até` é EXCLUSIVO. */}
          <div className={field}>
            <span className={fieldLabel}>{L.periodo}</span>
            <div className={periodRow}>
              <input
                className={dateInput}
                type="date"
                aria-label={L.periodoDe}
                value={props.dueFrom}
                onChange={(e) => {
                  props.onPeriodChange({ dueFrom: e.target.value })
                }}
              />
              <input
                className={dateInput}
                type="date"
                aria-label={L.periodoAte}
                value={props.dueTo}
                onChange={(e) => {
                  props.onPeriodChange({ dueTo: e.target.value })
                }}
              />
            </div>
          </div>
          {/* Limite — client-side (dirige a matemática do gráfico de compliance). Currency como texto. */}
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
          <Field label={L.centro} placeholder={L.allOption} field={props.centro} />
          <Field label={L.categoria} placeholder={L.allOption} field={props.categoria} />
          <Field label={L.subcategoria} placeholder={L.allOption} field={props.subcategoria} />
        </div>
      </div>

      <div className={panelFooter}>
        {/* "Limpar filtros" zera os 7 de uma vez — removê-los um a um era o único caminho. Aplica na
            hora (não espera o "Filtrar"): limpar É voltar a ver tudo. */}
        <button type="button" className={clearButton} onClick={props.onLimpar}>
          {L.limpar}
        </button>
        <div className={footerRight}>
          <button type="button" className={applyButton} onClick={props.onFiltrar}>
            {L.filtrar}
          </button>
          {props.exportSlot}
        </div>
      </div>
    </div>
  )
}
