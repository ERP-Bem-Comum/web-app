/**
 * FluxoCaixaPage — tela do relatório "Fluxo de Caixa" (identidade "brand", full-bleed 28px), no MOLDE dos
 * demais relatórios: cabeçalho (voltar + título + Filtros + Exportar) → filtros recolhíveis → KPIs → gráfico
 * "por vencimento" → as 2 seções (Saídas / Entradas). Front-first: os dados vêm de constantes placeholder
 * SINTÉTICAS (ver `fluxo-caixa.placeholder.ts`); o endpoint do core-api (#114) ainda não existe.
 *
 * A ViewModel PURA (`loadFluxoCaixa`) faz TODA a agregação (2 seções × 2 medidas, Saldo = Entradas − Saídas,
 * série mensal por vencimento); a page só compõe as views burras e guarda o ÚNICO UI-state local: o toggle dos
 * filtros. Export = CSV (Blob, seções fiéis) + PDF (window.print, via `report-export-dropdown`). ADR-0009/0012,§XI.
 *
 * ⚠️ ENTRADAS = receivables (core-api#114): hoje placeholder mínimo só p/ validar; quando o A-Receber subir e a
 * fonte de Entradas virar `[]`, a seção Entradas cai no empty state honesto SEM quebrar Saídas nem o Saldo.
 */
import { useMemo, useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { screen } from '#shared/ui/brand/brand-page.css.ts'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon } from '#shared/ui/index.ts'

import {
  loadFluxoCaixa,
  buildCsv,
  formatBRL,
  formatBRLShort,
  formatPercent,
  sectionDonutData,
  executionPercent,
  type FluxoMeasures,
  type FluxoSection,
} from '../fluxo-caixa.view-model.ts'
import { RealizadoChartsMount } from '../components/realizado-charts-mount.component.tsx'
import { FluxoCaixaTimeline } from '../components/fluxo-caixa-timeline.component.tsx'
import { FluxoCaixaCostCenterBars } from '../components/fluxo-caixa-cost-center-bars.component.tsx'
import { RealizadoDonut, type DonutSlice } from '../components/realizado-donut.component.tsx'
import { FluxoCaixaSectionTable } from '../components/fluxo-caixa-section-table.component.tsx'
import { ReportExportDropdown } from '../components/report-export-dropdown.component.tsx'
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
  sections,
  exportTrigger,
} from './fluxo-caixa.page.css.ts'

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

export function FluxoCaixaPage(): ReactNode {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const report = useMemo(() => loadFluxoCaixa(), [])

  const saidasTitle = t('reports.fluxoCaixa.section.saidas.title')
  const entradasTitle = t('reports.fluxoCaixa.section.entradas.title')

  const measureLabels: Readonly<Record<keyof FluxoMeasures, string>> = {
    realizedCents: t('reports.fluxoCaixa.measure.realizado'),
    expectedCents: t('reports.fluxoCaixa.measure.previsto'),
  }
  const previstoLabel = t('reports.fluxoCaixa.chart.previsto')
  const realizadoLabel = t('reports.fluxoCaixa.chart.realizado')

  // Fatias dos 2 donuts (Previsto × Realizado por seção) — derivadas dos totais já agregados (ViewModel pura).
  const entradasDonut = buildDonutSlices(report.entradas, entradasTitle, previstoLabel, realizadoLabel)
  const saidasDonut = buildDonutSlices(report.saidas, saidasTitle, previstoLabel, realizadoLabel)

  // Rótulos de Status alinhados ao Contas a Pagar (reusa os chips do CAP), como na Análise de Pagamentos.
  const statusOptions = [
    t('reports.fluxoCaixa.filters.allOption'),
    t('financial.list.chip.rascunho'),
    t('financial.list.chip.aberto'),
    t('financial.list.chip.aprovado'),
    t('financial.list.chip.pago'),
    t('financial.list.chip.conciliado'),
  ]

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
        <h1 className={headTitle}>{t('reports.fluxoCaixa.title')}</h1>
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

      {/* Filtros recolhíveis (placeholders visuais front-first) */}
      <div className={filtersOpen ? filters.open : filters.closed}>
        <div className={filtersInner}>
          <FilterField
            label={t('reports.fluxoCaixa.filters.programa')}
            options={[t('reports.fluxoCaixa.filters.allOption')]}
          />
          <FilterField
            label={t('reports.fluxoCaixa.filters.plano')}
            options={[t('reports.fluxoCaixa.filters.allOption')]}
          />
          <FilterField
            label={t('reports.fluxoCaixa.filters.periodo')}
            options={[t('reports.fluxoCaixa.filters.allOption')]}
          />
          <FilterField
            label={t('reports.fluxoCaixa.filters.conta')}
            options={[t('reports.fluxoCaixa.filters.allOption')]}
          />
          <FilterField
            label={t('reports.fluxoCaixa.filters.centro')}
            options={[t('reports.fluxoCaixa.filters.allOption')]}
          />
          <FilterField
            label={t('reports.fluxoCaixa.filters.categoria')}
            options={[t('reports.fluxoCaixa.filters.allOption')]}
          />
          <FilterField
            label={t('reports.fluxoCaixa.filters.subcategoria')}
            options={[t('reports.fluxoCaixa.filters.allOption')]}
          />
          <FilterField label={t('reports.fluxoCaixa.filters.status')} options={statusOptions} />
          <button type="button" className={applyButton}>
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
                  <h2 className={cardTitle}>{t('reports.fluxoCaixa.chart.timeline')}</h2>
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
                    formatAxis={formatBRLShort}
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

      {/* As 2 seções (Saídas / Entradas) */}
      <div className={sections}>
        <FluxoCaixaSectionTable
          section={report.saidas}
          labels={{
            cardTitle: saidasTitle,
            nameCol: t('reports.fluxoCaixa.section.nameCol'),
            measureLabels,
            totalRow: t('reports.fluxoCaixa.section.saidas.totalRow'),
            expand: t('reports.fluxoCaixa.tree.expand'),
            collapse: t('reports.fluxoCaixa.tree.collapse'),
            empty: t('reports.fluxoCaixa.section.saidas.empty'),
            emptyHint: t('reports.fluxoCaixa.section.saidas.emptyHint'),
          }}
        />
        <FluxoCaixaSectionTable
          section={report.entradas}
          labels={{
            cardTitle: entradasTitle,
            nameCol: t('reports.fluxoCaixa.section.nameCol'),
            measureLabels,
            totalRow: t('reports.fluxoCaixa.section.entradas.totalRow'),
            expand: t('reports.fluxoCaixa.tree.expand'),
            collapse: t('reports.fluxoCaixa.tree.collapse'),
            empty: t('reports.fluxoCaixa.section.entradas.empty'),
            emptyHint: t('reports.fluxoCaixa.section.entradas.emptyHint'),
          }}
        />
      </div>
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

/** Campo de filtro (select nativo placeholder — só a forma/estilo brand). */
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
