/**
 * FluxoCaixaPage — tela do relatório "Fluxo de Caixa" (identidade "brand", full-bleed 28px), no MOLDE dos
 * demais relatórios: cabeçalho (voltar + título + Filtros + Exportar) → filtros recolhíveis → KPIs → gráfico
 * "por vencimento" → as 2 seções (Saídas / Entradas). Dados REAIS do core-api (#590): o binding `useFluxoCaixa`
 * lê a resposta composta (árvore Saídas do `/cashflow` + série temporal do `/cashflow/chart`).
 *
 * A ViewModel PURA (`buildReportFromCashflow`) faz TODA a agregação (2 seções × 2 medidas, Saldo = Entradas −
 * Saídas, série temporal por vencimento); a page só compõe as views burras e guarda o ÚNICO UI-state local: o
 * toggle dos filtros. Export = CSV (Blob, seções fiéis) + PDF (window.print, via `report-export-dropdown`).
 * ADR-0009/0012, §XI. O gráfico de Centro de Custo é RECONSTRUÍDO pelo BFF via fan-out (o #590 não expõe CC
 * como eixo — #590 CA6): uma chamada `/cashflow?costCenterId` por CC do catálogo, somada.
 *
 * ⚠️ ENTRADAS = receivables: SEMPRE `[]` (financial é payables-centric) → a seção Entradas cai no empty state
 * honesto SEM quebrar Saídas nem o Saldo. Quando o Contas a Receber subir, é só a fonte de Entradas entrar.
 */
import { useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { screen, headSubtitle } from '#shared/ui/brand/brand-page.css.ts'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon } from '#shared/ui/index.ts'

import {
  buildCsv,
  formatBRL,
  formatAmount,
  formatBRLShort,
  formatBRLAxis,
  formatPercent,
  sectionDonutData,
  executionPercent,
  timelineYearLabel,
  type FluxoSection,
} from '../fluxo-caixa.view-model.ts'
import { useFluxoCaixa, type FluxoCaixaFilter } from '../fluxo-caixa.binding.ts'
import { useFluxoFilterOptions, type FilterOption } from '../fluxo-filters.binding.ts'
import { buildFilterSummaryParts, formatDueRange } from '../filters-summary.view-model.ts'
import { headTitleBlock } from './posicao-pagamentos.page.css.ts'
import { RealizadoChartsMount } from '../components/realizado-charts-mount.component.tsx'
import { FluxoCaixaTimeline } from '../components/fluxo-caixa-timeline.component.tsx'
import { FluxoCaixaCostCenterBars } from '../components/fluxo-caixa-cost-center-bars.component.tsx'
import { RealizadoDonut, type DonutSlice } from '../components/realizado-donut.component.tsx'
import { FluxoCaixaStatement } from '../components/fluxo-caixa-statement.component.tsx'
import { ReportExportDropdown } from '../components/report-export-dropdown.component.tsx'
import { ReportStatePanel } from '../components/report-state-panel.component.tsx'
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
  chartCard,
  chartPad,
  cardHeader,
  cardTitle,
  cardTitleYear,
  kpis,
  kpi,
  kpiDot,
  kpiLabel,
  kpiValue,
  kpiSub,
  kpiAccentFluxo,
  kpiValueToneFluxo,
  saldoValueTone,
  kpiTintNeg,
  charts4,
  exportTrigger,
  periodRow,
  dateInput,
} from './fluxo-caixa.page.css.ts'

const t = createTranslator(ptBR)

/** DRAFT dos filtros do Fluxo (strings da UI; "" = "Todos" / sem recorte). Datas em `YYYY-MM-DD`. */
type FluxoDraft = Readonly<{
  programa: string
  plano: string
  conta: string
  centro: string
  categoria: string
  subcategoria: string
  status: string
  dueFrom: string
  dueTo: string
}>
const EMPTY_DRAFT: FluxoDraft = {
  programa: '',
  plano: '',
  conta: '',
  centro: '',
  categoria: '',
  subcategoria: '',
  status: '',
  dueFrom: '',
  dueTo: '',
}

// Enum FECHADO de status filtrável do cashflow (#590 = os 6 do #588/#442, sem Draft/Refused).
const STATUS_VALUES = [
  'Open',
  'Approved',
  'Transmitted',
  'Paid',
  'PartiallyReconciled',
  'Reconciled',
] as const
const asStatus = (s: string): string | undefined => STATUS_VALUES.find((x) => x === s)

/** Converte o draft (strings da UI) no filtro do endpoint: "" → undefined (sem recorte). Nomes id-suffixed (#590). */
function toCashflowFilter(d: FluxoDraft): FluxoCaixaFilter {
  const v = (x: string): string | undefined => (x === '' ? undefined : x)
  return {
    programId: v(d.programa),
    budgetPlanId: v(d.plano),
    accountId: v(d.conta),
    costCenterId: v(d.centro),
    categoryId: v(d.categoria),
    subCategoryId: v(d.subcategoria),
    dueFrom: v(d.dueFrom),
    dueTo: v(d.dueTo),
    status: asStatus(d.status),
  }
}

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

export function FluxoCaixaPage(): ReactNode {
  // UI-state local (§XI): filtros abertos + DRAFT (edição) e APLICADO (o que a query consulta). "Filtrar" commita.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draft, setDraft] = useState<FluxoDraft>(EMPTY_DRAFT)
  const [applied, setApplied] = useState<FluxoCaixaFilter>({})

  // Server-state REAL do core-api (#590) com os filtros APLICADOS. Opções dos dropdowns cross-módulo (public-api,
  // §I); Centro/Categoria/Subcategoria em CASCATA da árvore do plano do DRAFT (ADR-0051). Hooks SEMPRE antes dos
  // early-returns (Rules of Hooks).
  const state = useFluxoCaixa(applied)
  const filterOpts = useFluxoFilterOptions(draft.plano, draft.centro, draft.categoria)

  if (state.status === 'loading') {
    return <ReportStatePanel title={t('reports.fluxoCaixa.loading')} />
  }
  if (state.status === 'error') {
    return (
      <ReportStatePanel role="alert" title={t('reports.fluxoCaixa.errorTitle')} hint={t(state.errorTag)} />
    )
  }
  const report = state.report

  const saidasTitle = t('reports.fluxoCaixa.section.saidas.title')
  const entradasTitle = t('reports.fluxoCaixa.section.entradas.title')

  const previstoLabel = t('reports.fluxoCaixa.chart.previsto')
  const realizadoLabel = t('reports.fluxoCaixa.chart.realizado')

  // Fatias dos 2 donuts (Previsto × Realizado por seção) — derivadas dos totais já agregados (ViewModel pura).
  const entradasDonut = buildDonutSlices(report.entradas, entradasTitle, previstoLabel, realizadoLabel)
  const saidasDonut = buildDonutSlices(report.saidas, saidasTitle, previstoLabel, realizadoLabel)

  const allOption = t('reports.fluxoCaixa.filters.allOption')
  // Status filtrável (enum #590 → rótulos i18n do Contas a Pagar). value = enum; label = chip do CAP.
  const statusOptions: readonly FilterOption[] = [
    { value: 'Open', label: t('financial.list.chip.aberto') },
    { value: 'Approved', label: t('financial.list.chip.aprovado') },
    { value: 'Transmitted', label: t('financial.list.chip.transmitido') },
    { value: 'Paid', label: t('financial.list.chip.pago') },
    { value: 'PartiallyReconciled', label: t('reports.posicao.filters.statusOpt.partiallyReconciled') },
    { value: 'Reconciled', label: t('financial.list.chip.conciliado') },
  ]

  // Patch do draft com CASCATA: trocar um nível ZERA os dependentes (não manda ref órfão do plano anterior).
  const onField = (patch: Partial<FluxoDraft>): void => {
    setDraft((d) => {
      const next = { ...d, ...patch }
      if ('plano' in patch) {
        next.centro = ''
        next.categoria = ''
        next.subcategoria = ''
      }
      if ('centro' in patch) {
        next.categoria = ''
        next.subcategoria = ''
      }
      if ('categoria' in patch) next.subcategoria = ''
      return next
    })
  }

  // Resumo dos filtros APLICADOS (reflete `applied`, não o draft) — abaixo do título quando recolhidos. UUID →
  // rótulo via as options carregadas; período em DD/MM/AAAA. Só as dimensões setadas entram (helper puro §XI).
  const appliedDueRange = formatDueRange(applied.dueFrom ?? '', applied.dueTo ?? '', {
    fromPrefix: t('reports.filters.summary.fromPrefix'),
    toPrefix: t('reports.filters.summary.toPrefix'),
  })
  const subtitleParts = buildFilterSummaryParts([
    {
      label: t('reports.fluxoCaixa.filters.programa'),
      value: applied.programId ?? '',
      options: filterOpts.programa,
    },
    {
      label: t('reports.fluxoCaixa.filters.plano'),
      value: applied.budgetPlanId ?? '',
      options: filterOpts.plano,
    },
    { label: t('reports.fluxoCaixa.filters.periodo'), value: appliedDueRange },
    {
      label: t('reports.fluxoCaixa.filters.conta'),
      value: applied.accountId ?? '',
      options: filterOpts.conta,
    },
    {
      label: t('reports.fluxoCaixa.filters.centro'),
      value: applied.costCenterId ?? '',
      options: filterOpts.centro,
    },
    {
      label: t('reports.fluxoCaixa.filters.categoria'),
      value: applied.categoryId ?? '',
      options: filterOpts.categoria,
    },
    {
      label: t('reports.fluxoCaixa.filters.subcategoria'),
      value: applied.subCategoryId ?? '',
      options: filterOpts.subcategoria,
    },
    { label: t('reports.fluxoCaixa.filters.status'), value: applied.status ?? '', options: statusOptions },
  ])

  return (
    <div className={screen}>
      {/* Cabeçalho: voltar + título + Filtros/Exportar */}
      <div className={head}>
        <button
          type="button"
          className={backButton}
          aria-label={t('reports.fluxoCaixa.back')}
          onClick={() => {
            window.history.back()
          }}
        >
          <ChevronLeftIcon size={18} />
        </button>
        <div className={headTitleBlock}>
          <h1 className={headTitle}>{t('reports.fluxoCaixa.title')}</h1>
          {subtitleParts.length > 0 && <p className={headSubtitle}>{subtitleParts.join(' · ')}</p>}
        </div>
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
            {t('reports.fluxoCaixa.filters.title')}
          </button>
          <ReportExportDropdown
            triggerClassName={exportTrigger}
            exportLabel={t('reports.fluxoCaixa.export.label')}
            csvLabel={t('reports.fluxoCaixa.export.csv')}
            pdfLabel={t('reports.fluxoCaixa.export.pdf')}
            onExportCsv={() => {
              downloadCsv('fluxo-caixa.csv', buildCsv(report, saidasTitle, entradasTitle))
            }}
          />
        </div>
      </div>

      {/* Filtros recolhíveis — POPULADOS e APLICÁVEIS (#590). "Filtrar" commita draft→aplicado → re-busca. */}
      <div className={filtersOpen ? filters.open : filters.closed}>
        <div className={filtersInner}>
          <FilterField
            label={t('reports.fluxoCaixa.filters.programa')}
            allOption={allOption}
            value={draft.programa}
            options={filterOpts.programa}
            onChange={(v) => {
              onField({ programa: v })
            }}
          />
          <FilterField
            label={t('reports.fluxoCaixa.filters.plano')}
            allOption={allOption}
            value={draft.plano}
            options={filterOpts.plano}
            onChange={(v) => {
              onField({ plano: v })
            }}
          />
          {/* Período de vencimento: DOIS inputs de data (De / Até) — janela [dueFrom, dueTo). */}
          <div className={fld}>
            <label className={fldLabel}>{t('reports.fluxoCaixa.filters.periodo')}</label>
            <div className={periodRow}>
              <input
                type="date"
                className={dateInput}
                aria-label={t('reports.fluxoCaixa.filters.periodoDe')}
                value={draft.dueFrom}
                onChange={(e) => {
                  onField({ dueFrom: e.target.value })
                }}
              />
              <input
                type="date"
                className={dateInput}
                aria-label={t('reports.fluxoCaixa.filters.periodoAte')}
                value={draft.dueTo}
                onChange={(e) => {
                  onField({ dueTo: e.target.value })
                }}
              />
            </div>
          </div>
          <FilterField
            label={t('reports.fluxoCaixa.filters.conta')}
            allOption={allOption}
            value={draft.conta}
            options={filterOpts.conta}
            onChange={(v) => {
              onField({ conta: v })
            }}
          />
          <FilterField
            label={t('reports.fluxoCaixa.filters.centro')}
            allOption={allOption}
            value={draft.centro}
            options={filterOpts.centro}
            onChange={(v) => {
              onField({ centro: v })
            }}
          />
          <FilterField
            label={t('reports.fluxoCaixa.filters.categoria')}
            allOption={allOption}
            value={draft.categoria}
            options={filterOpts.categoria}
            onChange={(v) => {
              onField({ categoria: v })
            }}
          />
          <FilterField
            label={t('reports.fluxoCaixa.filters.subcategoria')}
            allOption={allOption}
            value={draft.subcategoria}
            options={filterOpts.subcategoria}
            onChange={(v) => {
              onField({ subcategoria: v })
            }}
          />
          <FilterField
            label={t('reports.fluxoCaixa.filters.status')}
            allOption={allOption}
            value={draft.status}
            options={statusOptions}
            onChange={(v) => {
              onField({ status: v })
            }}
          />
          <button
            type="button"
            className={applyButton}
            onClick={() => {
              setApplied(toCashflowFilter(draft))
            }}
          >
            {t('reports.fluxoCaixa.filters.filtrar')}
          </button>
        </div>
      </div>

      {/* KPIs: Saídas · Entradas · Saldo (realizado) · Saldo (previsto) */}
      <div className={kpis}>
        <div className={kpi}>
          <div className={kpiLabel}>
            <span className={`${kpiDot} ${kpiAccentFluxo.saidas}`} aria-hidden="true" />
            {t('reports.fluxoCaixa.kpi.saidas')}
          </div>
          <div className={`${kpiValue} ${kpiValueToneFluxo.saidas}`}>
            {formatBRL(report.saidas.totals.realizedCents)}
          </div>
          <div className={kpiSub}>{t('reports.fluxoCaixa.kpi.saidasSub')}</div>
        </div>
        <div className={kpi}>
          <div className={kpiLabel}>
            <span className={`${kpiDot} ${kpiAccentFluxo.entradas}`} aria-hidden="true" />
            {t('reports.fluxoCaixa.kpi.entradas')}
          </div>
          <div className={`${kpiValue} ${kpiValueToneFluxo.entradas}`}>
            {formatBRL(report.entradas.totals.realizedCents)}
          </div>
          <div className={kpiSub}>{t('reports.fluxoCaixa.kpi.entradasSub')}</div>
        </div>
        <SaldoKpi
          label={t('reports.fluxoCaixa.kpi.saldoRealizado')}
          sub={t('reports.fluxoCaixa.kpi.saldoRealizadoSub')}
          cents={report.saldo.realizedCents}
        />
        <SaldoKpi
          label={t('reports.fluxoCaixa.kpi.saldoPrevisto')}
          sub={t('reports.fluxoCaixa.kpi.saldoPrevistoSub')}
          cents={report.saldo.expectedCents}
        />
      </div>

      {/* Os 4 gráficos "Previsto × Realizado": linha do tempo → barras por Centro de Custo → 2 donuts */}
      <RealizadoChartsMount>
        {(animate) => (
          <>
            {/* Os 4 gráficos numa linha só (compactos e alinhados): Linha do tempo · Centro de Custo · Entradas · Saídas */}
            <div className={charts4}>
              <div className={chartCard}>
                <div className={cardHeader}>
                  <h2 className={cardTitle}>
                    {t('reports.fluxoCaixa.chart.timeline')}
                    {timelineYearLabel(report.timeline) !== '' ? (
                      <span className={cardTitleYear}> · {timelineYearLabel(report.timeline)}</span>
                    ) : null}
                  </h2>
                </div>
                <div className={chartPad}>
                  <FluxoCaixaTimeline
                    points={report.timeline}
                    emptyLabel={t('reports.fluxoCaixa.chartEmptyLabel')}
                    animate={animate}
                    ariaLabel={t('reports.fluxoCaixa.chart.timeline')}
                    labels={{
                      previsto: t('reports.fluxoCaixa.chart.esperado'),
                      realizado: realizadoLabel,
                      saldo: t('reports.fluxoCaixa.chart.saldo'),
                    }}
                    formatValue={formatBRL}
                    formatAxis={formatBRLAxis}
                  />
                </div>
              </div>

              <div className={chartCard}>
                <div className={cardHeader}>
                  <h2 className={cardTitle}>{t('reports.fluxoCaixa.chart.byCostCenter')}</h2>
                </div>
                <div className={chartPad}>
                  <FluxoCaixaCostCenterBars
                    bars={report.byCostCenter}
                    emptyLabel={t('reports.fluxoCaixa.chartEmptyLabel')}
                    animate={animate}
                    labels={{ previsto: previstoLabel, realizado: realizadoLabel }}
                    formatValue={formatBRLShort}
                  />
                </div>
              </div>

              {/* Donuts Entradas × Saídas (Previsto × Realizado) */}
              <div className={chartCard}>
                <div className={cardHeader}>
                  <h2 className={cardTitle}>{entradasTitle}</h2>
                </div>
                <div className={chartPad}>
                  <RealizadoDonut
                    slices={entradasDonut}
                    centerValue={formatPercent(executionPercent(report.entradas))}
                    centerCaption={t('reports.fluxoCaixa.chart.execucao')}
                    emptyLabel={t('reports.fluxoCaixa.chartEmptyLabel')}
                    animate={animate}
                    formatValue={formatBRL}
                    formatPercent={formatPercent}
                  />
                </div>
              </div>

              <div className={chartCard}>
                <div className={cardHeader}>
                  <h2 className={cardTitle}>{saidasTitle}</h2>
                </div>
                <div className={chartPad}>
                  <RealizadoDonut
                    slices={saidasDonut}
                    centerValue={formatPercent(executionPercent(report.saidas))}
                    centerCaption={t('reports.fluxoCaixa.chart.execucao')}
                    emptyLabel={t('reports.fluxoCaixa.chartEmptyLabel')}
                    animate={animate}
                    formatValue={formatBRL}
                    formatPercent={formatPercent}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </RealizadoChartsMount>

      {/* Demonstrativo de fluxo de caixa (statement por mês — Real | Prev por mês, seções +Entradas/−Saídas) */}
      <FluxoCaixaStatement
        statement={report.statement}
        formatValue={formatAmount}
        labels={{
          cardTitle: t('reports.fluxoCaixa.stmt.title'),
          hint: t('reports.fluxoCaixa.stmt.hint'),
          descCol: t('reports.fluxoCaixa.stmt.descCol'),
          totalCol: t('reports.fluxoCaixa.stmt.totalCol'),
          realShort: t('reports.fluxoCaixa.stmt.real'),
          prevShort: t('reports.fluxoCaixa.stmt.prev'),
          saldoInicial: t('reports.fluxoCaixa.stmt.saldoInicial'),
          entradas: t('reports.fluxoCaixa.stmt.entradas'),
          totalEntradas: t('reports.fluxoCaixa.stmt.totalEntradas'),
          saidas: t('reports.fluxoCaixa.stmt.saidas'),
          totalSaidas: t('reports.fluxoCaixa.stmt.totalSaidas'),
          liquido: t('reports.fluxoCaixa.stmt.liquido'),
          saldoAcumulado: t('reports.fluxoCaixa.stmt.saldoAcumulado'),
          emptyEntradas: t('reports.fluxoCaixa.stmt.emptyEntradas'),
          monthsFrom: t('reports.fluxoCaixa.stmt.monthsFrom'),
          monthsTo: t('reports.fluxoCaixa.stmt.monthsTo'),
          prevMonth: t('reports.fluxoCaixa.stmt.prevMonth'),
          nextMonth: t('reports.fluxoCaixa.stmt.nextMonth'),
        }}
      />
    </div>
  )
}

/**
 * Constrói as 2 fatias do donut Previsto × Realizado de uma seção: a chave da medida vira a cor (measureKey
 * `fluxoPrevisto`/`fluxoRealizado`) e o rótulo compõe "<Seção> <Medida>" (ex.: "Entradas Previsto"). Quando a
 * seção vem vazia (totais 0), ambos os valores são 0 → o donut cai no empty-state honesto (não quebra).
 */
function buildDonutSlices(
  section: FluxoSection,
  sectionTitle: string,
  previstoLabel: string,
  realizadoLabel: string,
): readonly DonutSlice[] {
  return sectionDonutData(section).map(
    (s): DonutSlice => ({
      id: `${sectionTitle}-${s.key}`,
      label: `${sectionTitle} ${s.key === 'previsto' ? previstoLabel : realizadoLabel}`,
      valueCents: s.valueCents,
      measureKey: s.key === 'previsto' ? 'fluxoPrevisto' : 'fluxoRealizado',
    }),
  )
}

/**
 * KPI de Saldo — bolinha + valor coloridos por sinal (positivo verde / negativo vermelho). Quando NEGATIVO, o
 * card ganha fundo vermelho suave (resultado do período no vermelho), destacando dos brancos.
 */
function SaldoKpi({ label, sub, cents }: { label: string; sub: string; cents: number }): ReactNode {
  const positive = cents >= 0
  return (
    <div className={`${kpi} ${positive ? '' : kpiTintNeg}`}>
      <div className={kpiLabel}>
        <span
          className={`${kpiDot} ${positive ? kpiAccentFluxo.saldoPos : kpiAccentFluxo.saldoNeg}`}
          aria-hidden="true"
        />
        {label}
      </div>
      <div className={`${kpiValue} ${positive ? saldoValueTone.pos : saldoValueTone.neg}`}>
        {formatBRL(cents)}
      </div>
      <div className={kpiSub}>{sub}</div>
    </div>
  )
}

/** Campo de filtro CONTROLADO (select brand): opção "Todos" (value "") + as opções reais (value+label). */
function FilterField({
  label,
  allOption,
  value,
  options,
  onChange,
}: {
  label: string
  allOption: string
  value: string
  options: readonly FilterOption[]
  onChange: (value: string) => void
}): ReactNode {
  return (
    <div className={fld}>
      <label className={fldLabel}>{label}</label>
      <div className={fldCtrl}>
        <select
          className={fldSelect}
          aria-label={label}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
          }}
        >
          <option value="">{allOption}</option>
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
