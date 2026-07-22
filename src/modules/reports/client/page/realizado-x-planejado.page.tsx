/**
 * RealizadoXPlanejadoPage — tela do relatório "Realizado × Planejado" (reprodução do mock
 * `realizado-planejado-v2`, identidade "brand", full-bleed 28px). Dado REAL do core-api (S6 · GET
 * /reports/realized): o binding busca as linhas achatadas e a ViewModel PURA re-agrega na árvore + deriva
 * KPIs/gráficos/CSV. A page compõe as views burras e guarda o UI-state: toggle dos filtros + draft/aplicado.
 * Os gráficos ficam SEMPRE no topo. CSV pela ViewModel (Blob); PDF via window.print().
 *
 * Filtros (specs/084) alimentam a query: Programa/Plano/Estado/Município/Ano. "Filtrar" aplica draft→aplicado.
 * KPIs, colunas e o donut "Realizado vs previsto" refletem os valores reais do endpoint.
 */
import { useMemo, useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { screen } from '#shared/ui/brand/brand-page.css.ts'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon } from '#shared/ui/index.ts'

import {
  grandTotal,
  topCentroCustoByPlanejado,
  planejadoByMonth,
  buildCsv,
  formatBRL,
  formatBRLShort,
  formatPercent,
  computeAvPct,
  sharePercent,
  type BudgetTreeRow,
} from '../realizado-x-planejado.view-model.ts'
import { useRealizadoReport, type RealizedReportFilters } from '../realizado-x-planejado.binding.ts'
import {
  useProgramaOptions,
  usePlanoOptions,
  useEstadoOptions,
  useMunicipioOptions,
  useAnoOptions,
  type FilterOption,
} from '../realizado-filters.binding.ts'
import { ReportStatePanel } from '../components/report-state-panel.component.tsx'
import { ReportExportDropdown } from '../components/report-export-dropdown.component.tsx'
import { exportTrigger } from '../components/report-filters.css.ts'
import { RealizadoKpis } from '../components/realizado-kpis.component.tsx'
import {
  RealizadoCostCenterBars,
  type CostCenterBar,
} from '../components/realizado-cost-center-bars.component.tsx'
import { RealizadoLineChart } from '../components/realizado-line-chart.component.tsx'
import { RealizadoDonut, type DonutSlice } from '../components/realizado-donut.component.tsx'
import { RealizadoChartsMount } from '../components/realizado-charts-mount.component.tsx'
import { RealizadoTable } from '../components/realizado-table.component.tsx'
import {
  head,
  backButton,
  headTitle,
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
  charts3,
  chartCard,
  chartPad,
  cardHeader,
  cardTitle,
} from './realizado-x-planejado.page.css.ts'

const t = createTranslator(ptBR)

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

const YEAR = 2026

// Empties estáveis p/ os hooks rodarem SEM dado (loading/error) sem recriar array/objeto a cada render.
const EMPTY_ROWS: readonly BudgetTreeRow[] = []
const EMPTY_TOTAL = grandTotal(EMPTY_ROWS)

// Iniciais dos 12 meses (jan→dez) para o eixo X do gráfico de linha.
const MONTH_INITIALS: readonly string[] = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

// Participação (% do total planejado) a partir da qual um centro de custo recebe DESTAQUE de concentração.
const CONCENTRATION_THRESHOLD = 25

export function RealizadoXPlanejadoPage(): ReactNode {
  // UI-state da page: toggle dos filtros + o DRAFT (seleção em edição) e o APLICADO (o que consulta). "Filtrar"
  // commita draft→aplicado; assim o relatório só re-busca ao clicar, não a cada mexida no select.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draft, setDraft] = useState<RealizedReportFilters>({ year: YEAR })
  const [applied, setApplied] = useState<RealizedReportFilters>({ year: YEAR })

  // Opções REAIS dos filtros (cross-módulo via public-api). Município cascateia pela UF escolhida no draft.
  const programaOptions = useProgramaOptions()
  const planoOptions = usePlanoOptions()
  const estadoOptions = useEstadoOptions()
  const municipioOptions = useMunicipioOptions(draft.partnerStateId ?? '')
  const anoOptions = useAnoOptions()
  const allOption = t('reports.realizadoXPlanejado.filters.allOption')
  // Ano é OBRIGATÓRIO (sem "Todos"); sem planos → cai no YEAR default. Números → opções de select.
  const anoFilterOptions: readonly FilterOption[] = (anoOptions.length > 0 ? anoOptions : [YEAR]).map(
    (y) => ({
      value: String(y),
      label: String(y),
    }),
  )

  // Server-state REAL do core-api (S6 · GET /reports/realized): loading | error | ready. Usa os filtros
  // APLICADOS. O binding já re-agrega as linhas achatadas na árvore. (Refetch por filtro mantém o dado
  // anterior visível — o painel de loading só aparece na 1ª carga.)
  const report = useRealizadoReport(applied)
  const ready = report.status === 'ready'
  const rows = ready ? report.rows : EMPTY_ROWS
  const total = ready ? report.total : EMPTY_TOTAL

  // KPIs.
  const execPct = computeAvPct(total)

  // Barras "Por centro de custo" (top 6 por planejado) — a LARGURA é a % de participação no total; centros
  // com participação ≥ CONCENTRATION_THRESHOLD ganham destaque (âmbar). Rótulo = "R$ x · %".
  const costCenterBars: readonly CostCenterBar[] = useMemo(
    () =>
      topCentroCustoByPlanejado(rows, 6).map((s): CostCenterBar => {
        const share = sharePercent(s.valueCents, total.planejadoCents)
        return {
          id: s.id,
          label: s.label,
          sharePct: share,
          high: share >= CONCENTRATION_THRESHOLD,
          percentLabel: formatPercent(share),
          valueTitle: formatBRL(s.valueCents),
        }
      }),
    [rows, total.planejadoCents],
  )

  // Série mensal (jan→dez) para o gráfico de linha.
  const monthlyCents: readonly number[] = useMemo(
    () => planejadoByMonth(total).map((b) => b.planejadoCents),
    [total],
  )

  // Donut "Realizado vs previsto" — agora com dado REAL do endpoint (execução = realizado ÷ planejado).
  const donutExecPct = sharePercent(total.realizadoCents, total.planejadoCents)
  const donutSlices: readonly DonutSlice[] = useMemo(
    () => [
      {
        id: 'realizado',
        label: t('reports.realizadoXPlanejado.legend.realizado'),
        valueCents: total.realizadoCents,
        measureKey: 'realizado',
      },
      {
        id: 'provisionado',
        label: t('reports.realizadoXPlanejado.legend.provisionado'),
        valueCents: total.provisionadoCents,
        measureKey: 'provisionado',
      },
      {
        id: 'previsto',
        label: t('reports.realizadoXPlanejado.legend.previsto'),
        valueCents: total.planejadoCents,
        measureKey: 'previsto',
      },
    ],
    [total.planejadoCents, total.realizadoCents, total.provisionadoCents],
  )

  // Estados honestos (todos os hooks acima já rodaram — os early-returns abaixo não violam a regra dos hooks).
  if (report.status === 'loading') {
    return <ReportStatePanel title={t('reports.realizadoXPlanejado.loading')} />
  }
  if (report.status === 'error') {
    return (
      <ReportStatePanel
        role="alert"
        title={t('reports.realizadoXPlanejado.errorTitle')}
        hint={t(report.errorTag)}
      />
    )
  }

  return (
    <div className={screen}>
      {/* Cabeçalho: voltar + título + Filtros/Exportar */}
      <div className={head}>
        <button
          type="button"
          className={backButton}
          aria-label={t('reports.realizadoXPlanejado.back')}
          onClick={() => {
            window.history.back()
          }}
        >
          <ChevronLeftIcon size={18} />
        </button>
        <h1 className={headTitle}>{t('reports.realizadoXPlanejado.title')}</h1>
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
            {t('reports.realizadoXPlanejado.filters.title')}
          </button>
          <ReportExportDropdown
            triggerClassName={exportTrigger}
            exportLabel={t('reports.realizadoXPlanejado.export.label')}
            csvLabel={t('reports.realizadoXPlanejado.export.csv')}
            pdfLabel={t('reports.realizadoXPlanejado.export.pdf')}
            onExportCsv={() => {
              downloadCsv('realizado-x-planejado.csv', buildCsv(report.rawRows))
            }}
          />
        </div>
      </div>

      {/* Filtros REAIS (query params do /reports/realized). Draft nos selects; "Filtrar" aplica. */}
      <div className={filtersOpen ? filters.open : filters.closed}>
        <div className={filtersInner}>
          <FilterField
            label={t('reports.realizadoXPlanejado.filters.programa')}
            placeholder={allOption}
            value={draft.programId ?? ''}
            options={programaOptions}
            onChange={(v) => {
              setDraft((d) => ({ ...d, programId: v === '' ? undefined : v }))
            }}
          />
          <FilterField
            label={t('reports.realizadoXPlanejado.filters.plano')}
            placeholder={allOption}
            value={draft.budgetPlanId ?? ''}
            options={planoOptions}
            onChange={(v) => {
              setDraft((d) => ({ ...d, budgetPlanId: v === '' ? undefined : v }))
            }}
          />
          <FilterField
            label={t('reports.realizadoXPlanejado.filters.estado')}
            placeholder={allOption}
            value={draft.partnerStateId ?? ''}
            options={estadoOptions}
            onChange={(v) => {
              // Trocar a UF zera o município (a lista dele cascateia pela UF).
              setDraft((d) => ({
                ...d,
                partnerStateId: v === '' ? undefined : v,
                partnerMunicipalityId: undefined,
              }))
            }}
          />
          <FilterField
            label={t('reports.realizadoXPlanejado.filters.municipio')}
            placeholder={allOption}
            value={draft.partnerMunicipalityId ?? ''}
            options={municipioOptions}
            disabled={(draft.partnerStateId ?? '') === ''}
            onChange={(v) => {
              setDraft((d) => ({ ...d, partnerMunicipalityId: v === '' ? undefined : v }))
            }}
          />
          <FilterField
            label={t('reports.realizadoXPlanejado.filters.ano')}
            value={String(draft.year)}
            options={anoFilterOptions}
            onChange={(v) => {
              const y = Number(v)
              setDraft((d) => ({ ...d, year: Number.isFinite(y) && y > 0 ? y : YEAR }))
            }}
          />
          <button
            type="button"
            className={applyButton}
            onClick={() => {
              setApplied(draft)
            }}
          >
            {t('reports.realizadoXPlanejado.filters.filtrar')}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <RealizadoKpis
        plannedValue={formatBRL(total.planejadoCents)}
        realizedValue={formatBRL(total.realizadoCents)}
        provisionedValue={formatBRL(total.provisionadoCents)}
        executionValue={formatPercent(execPct)}
        labels={{
          planned: t('reports.realizadoXPlanejado.kpi.planned'),
          realized: t('reports.realizadoXPlanejado.kpi.realized'),
          provisioned: t('reports.realizadoXPlanejado.kpi.provisioned'),
          execution: t('reports.realizadoXPlanejado.kpi.execution'),
          plannedSub: t('reports.realizadoXPlanejado.kpi.plannedSub'),
          realizedSub: t('reports.realizadoXPlanejado.kpi.realizedSub').replace(
            '{{pct}}',
            formatPercent(execPct),
          ),
          provisionedSub: t('reports.realizadoXPlanejado.kpi.provisionedSub'),
          executionSub: t('reports.realizadoXPlanejado.kpi.executionSub'),
        }}
      />

      {/* 3 gráficos (animação de entrada gerida pelo mount wrapper) */}
      <RealizadoChartsMount>
        {(animate) => (
          <div className={charts3}>
            <div className={chartCard}>
              <div className={cardHeader}>
                <h2 className={cardTitle}>{t('reports.realizadoXPlanejado.charts.byCostCenter')}</h2>
              </div>
              <div className={chartPad}>
                <RealizadoCostCenterBars
                  bars={costCenterBars}
                  emptyLabel={t('reports.realizadoXPlanejado.empty')}
                  animate={animate}
                />
              </div>
            </div>

            <div className={chartCard}>
              <div className={cardHeader}>
                <h2 className={cardTitle}>{t('reports.realizadoXPlanejado.charts.monthly')}</h2>
              </div>
              <div className={chartPad}>
                <RealizadoLineChart
                  monthlyCents={monthlyCents}
                  monthInitials={MONTH_INITIALS}
                  monthNames={MONTH_TITLE()}
                  valueLabel={t('reports.realizadoXPlanejado.columns.planejado')}
                  formatValue={formatBRL}
                  ariaLabel={t('reports.realizadoXPlanejado.charts.monthly')}
                  emptyLabel={t('reports.realizadoXPlanejado.empty')}
                  animate={animate}
                />
              </div>
            </div>

            <div className={chartCard}>
              <div className={cardHeader}>
                <h2 className={cardTitle}>{t('reports.realizadoXPlanejado.charts.realizedVsForecast')}</h2>
              </div>
              <div className={chartPad}>
                <RealizadoDonut
                  slices={donutSlices}
                  centerValue={formatPercent(donutExecPct)}
                  centerCaption={t('reports.realizadoXPlanejado.charts.execCaption')}
                  emptyLabel={t('reports.realizadoXPlanejado.empty')}
                  animate={animate}
                  formatValue={formatBRLShort}
                  formatPercent={formatPercent}
                />
              </div>
            </div>
          </div>
        )}
      </RealizadoChartsMount>

      {/* Tabela "Detalhamento por mês" */}
      <RealizadoTable
        rows={rows}
        total={total}
        labels={{
          cardTitle: t('reports.realizadoXPlanejado.table.title'),
          centroCusto: t('reports.realizadoXPlanejado.columns.centroCusto'),
          provisionado: t('reports.realizadoXPlanejado.columns.provisionado'),
          realizado: t('reports.realizadoXPlanejado.columns.realizado'),
          planejado: t('reports.realizadoXPlanejado.columns.planejado'),
          av: t('reports.realizadoXPlanejado.columns.avShort'),
          provisAbbrev: t('reports.realizadoXPlanejado.columns.provisAbbrev'),
          realizAbbrev: t('reports.realizadoXPlanejado.columns.realizAbbrev'),
          planejAbbrev: t('reports.realizadoXPlanejado.columns.planejAbbrev'),
          consolidatedGroup: t('reports.realizadoXPlanejado.table.consolidatedGroup'),
          totalRow: t('reports.realizadoXPlanejado.totals.row'),
          monthAbbrev: MONTH_TITLE(),
          yearSuffix: String(YEAR).slice(-2),
          expand: t('reports.realizadoXPlanejado.tree.expand'),
          collapse: t('reports.realizadoXPlanejado.tree.collapse'),
          prevMonths: t('reports.realizadoXPlanejado.pager.prev'),
          nextMonths: t('reports.realizadoXPlanejado.pager.next'),
        }}
      />
    </div>
  )
}

/** Campo de filtro (select nativo CONTROLADO, estilo brand). `placeholder` → opção vazia "Todos" (value ''). */
function FilterField({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: {
  label: string
  value: string
  options: readonly FilterOption[]
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}): ReactNode {
  return (
    <div className={fld}>
      <label className={fldLabel}>{label}</label>
      <div className={fldCtrl}>
        <select
          className={fldSelect}
          aria-label={label}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value)
          }}
        >
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
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

/** Abreviações Title-case dos 12 meses (jan..dez) via i18n — grupos de mês da tabela ("Dez/26"). */
function MONTH_TITLE(): readonly string[] {
  return [
    t('reports.realizadoXPlanejado.monthTitle.jan'),
    t('reports.realizadoXPlanejado.monthTitle.feb'),
    t('reports.realizadoXPlanejado.monthTitle.mar'),
    t('reports.realizadoXPlanejado.monthTitle.apr'),
    t('reports.realizadoXPlanejado.monthTitle.may'),
    t('reports.realizadoXPlanejado.monthTitle.jun'),
    t('reports.realizadoXPlanejado.monthTitle.jul'),
    t('reports.realizadoXPlanejado.monthTitle.aug'),
    t('reports.realizadoXPlanejado.monthTitle.sep'),
    t('reports.realizadoXPlanejado.monthTitle.oct'),
    t('reports.realizadoXPlanejado.monthTitle.nov'),
    t('reports.realizadoXPlanejado.monthTitle.dec'),
  ]
}
