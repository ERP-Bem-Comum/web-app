/**
 * AnaliseReportView — CORPO compartilhado dos relatórios de "Análise" (Pagamentos 'p' e Recebimentos 'r').
 * View de composição BURRA: recebe o relatório JÁ AGREGADO (ViewModel pura `loadAnalise(type)`) + TODOS os
 * rótulos por props (i18n resolvido nas pages) + a cor dos gráficos (`chartTone`) + o nome do CSV, e monta
 * cabeçalho → filtros recolhíveis → 2 gráficos → tabela-matriz. NÃO deriva domínio nem toca a `data/`; o único
 * UI-state local é o toggle dos filtros (a expansão da árvore + o passador de meses são UI-state da própria
 * AnaliseTable). As pages 'p'/'r' são wrappers finos que só escolhem a fonte, os rótulos e o tom — ZERO
 * duplicação de composição (ADR-0009, §XI).
 *
 * ── EMPTY STATE HONESTO ── quando o relatório vem VAZIO (0 planos OU Total do Período 0), renderiza SÓ o
 * cabeçalho + um cartão único com a mensagem (`labels.empty`) — sem filtros/gráficos/tabela quebrados. É o
 * caminho para o qual a Análise de Recebimentos cai quando o placeholder for removido (fonte retorna `[]`).
 *
 * ── COR DISTINTA (Pag×Rec) ── `chartTone='rec'` pinta os 2 gráficos numa família DISTINTA da de Pagamentos:
 * barras "por Centro de Custo" em verde-azulado (`fillTone='analiseRec'`) + barras "Mensal" em roxo
 * (`tone='rec'`). Cor por CLASSE (§X) — a view não importa tokens.
 */
import { useMemo, useState, type ReactNode } from 'react'

import { screen, headSubtitle } from '#shared/ui/brand/brand-page.css.ts'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon } from '#shared/ui/index.ts'

import {
  buildCsv,
  totalByCostCenter,
  totalByMonth,
  formatBRL,
  formatBRLShort,
  formatPercent,
  formatMonthLabel,
  sharePercent,
  type AnaliseReport,
} from '../analise.view-model.ts'
import { ReportExportDropdown } from './report-export-dropdown.component.tsx'
import { exportTrigger } from './report-filters.css.ts'
import { RealizadoCostCenterBars, type CostCenterBar } from './realizado-cost-center-bars.component.tsx'
import { AnaliseMonthlyBars, type MonthlyBar } from './analise-monthly-bars.component.tsx'
import { RealizadoChartsMount } from './realizado-charts-mount.component.tsx'
import { AnaliseTable } from './analise-table.component.tsx'
import {
  head,
  backButton,
  headTitle,
  headTitleBlock,
  tools,
  filterToggle,
  filters,
  filtersInner,
  fld,
  fldLabel,
  fldCtrl,
  fldSelect,
  fldChev,
  applyButton,
  periodRow,
  dateInput,
  card,
  chartCard,
  chartPad,
  cardHeader,
  cardTitle,
  charts2,
  emptyPanel,
  emptyTitle,
  emptyHint,
} from '../page/analise-pagamentos.page.css.ts'

/** Todos os rótulos i18n do relatório, resolvidos na page (Pagamentos vs Recebimentos). */
export type AnaliseReportViewLabels = Readonly<{
  back: string
  title: string
  filters: Readonly<{
    title: string
    allOption: string
    programa: string
    plano: string
    periodo: string
    /** Rótulo do input de data inicial (janela de vencimento). */
    periodoDe: string
    /** Rótulo do input de data final (EXCLUSIVO no backend). */
    periodoAte: string
    conta: string
    status: string
    centro: string
    categoria: string
    subcategoria: string
    filtrar: string
    /** Rótulos dos chips de Status alinhados ao CAP (financial.list.chip.*), acrescidos após "Todos". */
    statusChips: readonly string[]
  }>
  export: Readonly<{ label: string; csv: string; pdf: string }>
  charts: Readonly<{ byCostCenter: string; monthly: string }>
  /** Fallback interno dos gráficos (barras) quando SEM barras — só no caminho não-vazio. */
  chartEmptyLabel: string
  table: Readonly<{
    cardTitle: string
    nameCol: string
    totalCol: string
    totalRow: string
    expand: string
    collapse: string
    prevMonths: string
    nextMonths: string
  }>
  /** Mensagem do empty state honesto (relatório vazio). */
  empty: string
  /** Complemento (2ª linha) do empty state. */
  emptyHint: string
}>

/** Opção de dropdown controlado (o `value` é o ref que dirige a cascata; `label` é o texto exibido). */
export type FilterOption = Readonly<{ value: string; label: string }>

/** Um campo CONTROLADO da cascata (Plano/Centro/Categoria/Subcategoria): opções + valor + onChange. */
export type AnaliseCascadeField = Readonly<{
  options: readonly FilterOption[]
  value: string
  onChange: (v: string) => void
}>

/**
 * Cascata de categorização dirigida pelo PLANO (ADR-0051). Plano → Centro → Categoria → Subcategoria: as
 * opções (e seus `value`) vêm da ÁRVORE do plano selecionado, não do catálogo operacional flat.
 */
export type AnaliseCascadeModel = Readonly<{
  plano: AnaliseCascadeField
  centro: AnaliseCascadeField
  categoria: AnaliseCascadeField
  subcategoria: AnaliseCascadeField
}>

export type AnaliseReportViewProps = Readonly<{
  report: AnaliseReport
  labels: AnaliseReportViewLabels
  /** Nome do arquivo CSV baixado (ex.: "analise-recebimentos.csv"). */
  csvFilename: string
  /** Cor dos 2 gráficos: `'pag'` (padrão) ou `'rec'` (paleta distinta da Análise de Recebimentos). */
  chartTone?: 'pag' | 'rec'
  /**
   * Opções populate-only (Programa/Conta) — rótulos sem "Todos" (a view faz o prepend). Ausente (Recebimentos)
   * → só "Todos". Populate-only: o endpoint #446 só aplica período/status.
   */
  filterOptions?: Readonly<{
    programa: readonly string[]
    conta: readonly string[]
  }>
  /**
   * Cascata CONTROLADA de Plano/Centro/Categoria/Subcategoria (Análise de Pagamentos). Presente → esses 4
   * campos viram selects controlados dirigidos pelo plano. Ausente (Recebimentos) → caem no modo "Todos".
   */
  cascade?: AnaliseCascadeModel
  /**
   * Período de vencimento APLICÁVEL (#446): DOIS inputs de data (De / Até; `dueTo` EXCLUSIVO). Presente
   * (Pagamentos) → o "Filtrar" aplica via `onFiltrar`; mudar a data NÃO refetch (só o clique). Ausente
   * (Recebimentos) → o Período vira dropdown "Todos" e o "Filtrar" fica inerte. A view segue burra (§XI).
   */
  period?: AnalisePeriodModel
  /**
   * Status APLICÁVEL (#446 filtra `fin_payable_view.status`): select CONTROLADO com o enum REDUZIDO
   * (Open/Approved/Paid) — o `value` é o enum, o `label` é o rótulo PT. Presente (Pagamentos) → o "Filtrar"
   * aplica junto com o período. Ausente (Recebimentos) → cai no dropdown visual dos chips do CAP (inerte).
   */
  statusFilter?: AnaliseCascadeField
  /**
   * Resumo dos filtros APLICADOS (partes já formatadas "Rótulo: valor"), abaixo do título. Só o que de fato
   * filtra o resultado (na Análise: período + status). Vazio/ausente → não renderiza a linha.
   */
  subtitleParts?: readonly string[]
}>

/** Contrato do Período de vencimento controlado (Análise de Pagamentos). Datas em `YYYY-MM-DD`. */
export type AnalisePeriodModel = Readonly<{
  dueFrom: string
  dueTo: string
  onChange: (patch: Readonly<{ dueFrom?: string; dueTo?: string }>) => void
  onFiltrar: () => void
}>

/** Baixa o CSV via Blob + anchor (client-side; o backend entregará JSON depois). */
function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function AnaliseReportView(props: AnaliseReportViewProps): ReactNode {
  const { report, labels: L, csvFilename } = props
  const isRec = props.chartTone === 'rec'
  // Prepend do "Todos" nas opções REAIS (ou só "Todos" quando a page não passa filterOptions — Recebimentos).
  const fo = props.filterOptions
  // Cascata controlada (Análise de Pagamentos); ausente em Recebimentos → os 4 campos caem no modo "Todos".
  const cx = props.cascade
  // Período aplicável (Análise de Pagamentos); ausente em Recebimentos → dropdown "Todos" + "Filtrar" inerte.
  const pd = props.period
  // Status aplicável (Análise de Pagamentos, enum reduzido); ausente em Recebimentos → dropdown visual dos chips.
  const sf = props.statusFilter
  const opt = (list: readonly string[] | undefined): readonly string[] => [
    L.filters.allOption,
    ...(list ?? []),
  ]
  // ÚNICO UI-state da view: filtros abertos/fechados.
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Empty state honesto: sem planos OU Total do Período zero → nada a exibir (a fonte veio vazia/zerada).
  const isEmpty = report.planos.length === 0 || report.totalPeriodo === 0
  // FILTRÁVEL = recebe algum controle de filtro (Pagamentos: period/cascade/filterOptions). Quando filtrável, o
  // botão "Filtros" + a barra seguem ACESSÍVEIS mesmo no vazio, p/ o usuário afrouxar/limpar o filtro e sair do
  // empty-state (não fica preso). Recebimentos (sem controles) mantém o empty-state bare.
  const filterable =
    props.period !== undefined || props.cascade !== undefined || props.filterOptions !== undefined
  const showFilterControls = !isEmpty || filterable

  const monthTotals = useMemo(() => totalByMonth(report), [report])

  // Barras "Distribuição por Centro de Custo" (total por CC, desc); largura = % do total do período.
  const costCenterBars: readonly CostCenterBar[] = useMemo(
    () =>
      totalByCostCenter(report).map((c): CostCenterBar => {
        const share = sharePercent(c.valueCents, report.totalPeriodo)
        return {
          id: c.id,
          label: c.name,
          sharePct: share,
          high: false,
          percentLabel: formatPercent(share),
          valueTitle: formatBRL(c.valueCents),
        }
      }),
    [report],
  )

  // Barras "Distribuição Mensal" (total por mês, ordem ASC do período) — rótulo já válido pela ViewModel.
  const monthlyBars: readonly MonthlyBar[] = useMemo(
    () =>
      monthTotals.map(
        (m): MonthlyBar => ({ id: m.key, label: formatMonthLabel(m.key), valueCents: m.valueCents }),
      ),
    [monthTotals],
  )

  return (
    <div className={screen}>
      {/* Cabeçalho: voltar + título (+ Filtros/Exportar só quando há dados) */}
      <div className={head}>
        <button
          type="button"
          className={backButton}
          aria-label={L.back}
          onClick={() => {
            window.history.back()
          }}
        >
          <ChevronLeftIcon size={18} />
        </button>
        <div className={headTitleBlock}>
          <h1 className={headTitle}>{L.title}</h1>
          {props.subtitleParts !== undefined && props.subtitleParts.length > 0 && (
            <p className={headSubtitle}>{props.subtitleParts.join(' · ')}</p>
          )}
        </div>
        {/* Filtros: toggle sempre que houver controles (mesmo vazio → não prende o usuário). Exportar só com dados. */}
        {showFilterControls && (
          <div className={tools}>
            <button
              type="button"
              className={filterToggle}
              aria-pressed={filtersOpen}
              onClick={() => {
                setFiltersOpen((v) => !v)
              }}
            >
              <FilterIcon size={16} />
              {L.filters.title}
            </button>
            {!isEmpty && (
              <ReportExportDropdown
                triggerClassName={exportTrigger}
                exportLabel={L.export.label}
                csvLabel={L.export.csv}
                pdfLabel={L.export.pdf}
                onExportCsv={() => {
                  downloadCsv(csvFilename, buildCsv(report))
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Barra de filtros recolhível — ACESSÍVEL mesmo no vazio quando filtrável (o usuário reabre e afrouxa). */}
      {showFilterControls && (
        <div className={filtersOpen ? filters.open : filters.closed}>
          {/* Opções REAIS via `filterOptions`/cascata/período; o #446 só APLICA período (e status, visual). */}
          <div className={filtersInner}>
            <FilterField label={L.filters.programa} options={opt(fo?.programa)} />
            {/* Plano/Centro/Categoria/Subcategoria: CONTROLADOS pela cascata do plano (Pagamentos); sem cascata
                  (Recebimentos) caem em "Todos". A regra da cascata vem do financial (ADR-0051). */}
            {cx ? (
              <ControlledFilterField
                label={L.filters.plano}
                placeholder={L.filters.allOption}
                field={cx.plano}
              />
            ) : (
              <FilterField label={L.filters.plano} options={[L.filters.allOption]} />
            )}
            {/* Período de vencimento: DOIS inputs de data (De / Até) quando aplicável; senão dropdown "Todos". */}
            {pd ? (
              <div className={fld}>
                <label className={fldLabel}>{L.filters.periodo}</label>
                <div className={periodRow}>
                  <input
                    type="date"
                    className={dateInput}
                    aria-label={L.filters.periodoDe}
                    value={pd.dueFrom}
                    onChange={(e) => {
                      pd.onChange({ dueFrom: e.target.value })
                    }}
                  />
                  <input
                    type="date"
                    className={dateInput}
                    aria-label={L.filters.periodoAte}
                    value={pd.dueTo}
                    onChange={(e) => {
                      pd.onChange({ dueTo: e.target.value })
                    }}
                  />
                </div>
              </div>
            ) : (
              <FilterField label={L.filters.periodo} options={[L.filters.allOption]} />
            )}
            <FilterField label={L.filters.conta} options={opt(fo?.conta)} />
            {/* Status: CONTROLADO e aplicável (enum reduzido Open/Approved/Paid do #446) quando `statusFilter`;
                sem ele (Recebimentos) cai no dropdown visual dos chips do CAP (inerte). */}
            {sf ? (
              <ControlledFilterField label={L.filters.status} placeholder={L.filters.allOption} field={sf} />
            ) : (
              <FilterField
                label={L.filters.status}
                options={[L.filters.allOption, ...L.filters.statusChips]}
              />
            )}
            {cx ? (
              <ControlledFilterField
                label={L.filters.centro}
                placeholder={L.filters.allOption}
                field={cx.centro}
              />
            ) : (
              <FilterField label={L.filters.centro} options={[L.filters.allOption]} />
            )}
            {cx ? (
              <ControlledFilterField
                label={L.filters.categoria}
                placeholder={L.filters.allOption}
                field={cx.categoria}
              />
            ) : (
              <FilterField label={L.filters.categoria} options={[L.filters.allOption]} />
            )}
            {cx ? (
              <ControlledFilterField
                label={L.filters.subcategoria}
                placeholder={L.filters.allOption}
                field={cx.subcategoria}
              />
            ) : (
              <FilterField label={L.filters.subcategoria} options={[L.filters.allOption]} />
            )}
            {/* "Filtrar" aplica período (Pagamentos, via onFiltrar); inerte em Recebimentos (sem `period`). */}
            <button
              type="button"
              className={applyButton}
              onClick={() => {
                pd?.onFiltrar()
              }}
            >
              {L.filters.filtrar}
            </button>
          </div>
        </div>
      )}

      {isEmpty ? (
        // Empty state HONESTO: um cartão único, sem gráficos/tabela (mas os filtros acima seguem acessíveis).
        <div className={card}>
          <div className={emptyPanel}>
            <p className={emptyTitle}>{L.empty}</p>
            <p className={emptyHint}>{L.emptyHint}</p>
          </div>
        </div>
      ) : (
        <>
          {/* 2 gráficos (animação de entrada gerida pelo mount wrapper) */}
          <RealizadoChartsMount>
            {(animate) => (
              <div className={charts2}>
                <div className={chartCard}>
                  <div className={cardHeader}>
                    <h2 className={cardTitle}>{L.charts.byCostCenter}</h2>
                  </div>
                  <div className={chartPad}>
                    <RealizadoCostCenterBars
                      bars={costCenterBars}
                      emptyLabel={L.chartEmptyLabel}
                      animate={animate}
                      fillTone={isRec ? 'analiseRec' : undefined}
                    />
                  </div>
                </div>

                <div className={chartCard}>
                  <div className={cardHeader}>
                    <h2 className={cardTitle}>{L.charts.monthly}</h2>
                  </div>
                  <div className={chartPad}>
                    <AnaliseMonthlyBars
                      bars={monthlyBars}
                      totalCents={report.totalPeriodo}
                      emptyLabel={L.chartEmptyLabel}
                      animate={animate}
                      formatValue={formatBRLShort}
                      formatShare={(v, tot) => formatPercent(sharePercent(v, tot))}
                      tone={isRec ? 'rec' : undefined}
                    />
                  </div>
                </div>
              </div>
            )}
          </RealizadoChartsMount>

          {/* Tabela-matriz "Análise por plano orçamentário" */}
          <AnaliseTable
            report={report}
            monthTotals={monthTotals}
            labels={{
              cardTitle: L.table.cardTitle,
              nameCol: L.table.nameCol,
              totalCol: L.table.totalCol,
              totalRow: L.table.totalRow,
              expand: L.table.expand,
              collapse: L.table.collapse,
              prevMonths: L.table.prevMonths,
              nextMonths: L.table.nextMonths,
            }}
          />
        </>
      )}
    </div>
  )
}

/** Campo de filtro (select nativo placeholder — só a forma/estilo brand). Uncontrolled (populate-only). */
function FilterField({ label, options }: { label: string; options: readonly string[] }): ReactNode {
  return (
    <div className={fld}>
      <label className={fldLabel}>{label}</label>
      <div className={fldCtrl}>
        <select className={fldSelect} aria-label={label}>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <span className={fldChev}>
          <ChevronDownIcon size={16} />
        </span>
      </div>
    </div>
  )
}

/**
 * Campo de filtro CONTROLADO (cascata do plano): {value,label} + value + onChange. `placeholder` → opção vazia
 * (value '') = "Todos" = sem seleção. Espelha o FilterField controlado da Posição.
 */
function ControlledFilterField({
  label,
  placeholder,
  field,
}: {
  label: string
  placeholder: string
  field: AnaliseCascadeField
}): ReactNode {
  return (
    <div className={fld}>
      <label className={fldLabel}>{label}</label>
      <div className={fldCtrl}>
        <select
          className={fldSelect}
          aria-label={label}
          value={field.value}
          onChange={(e) => {
            field.onChange(e.target.value)
          }}
        >
          <option value="">{placeholder}</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className={fldChev}>
          <ChevronDownIcon size={16} />
        </span>
      </div>
    </div>
  )
}
