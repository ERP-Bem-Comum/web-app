/**
 * AnalisePagamentosPage — tela do relatório "Análise de Pagamentos" (identidade "brand", full-bleed 28px).
 * Matriz TEMPO-orçamentária: árvore Plano Orçamentário → Centro de Custo × série MENSAL de valores. Front-first:
 * os dados vêm de constantes placeholder SINTÉTICAS (core-api#114/consolidated ainda não existe). A ViewModel
 * PURA faz toda a agregação/derivação; a page só compõe as views burras e guarda o ÚNICO UI-state local: o
 * toggle dos filtros. Layout de cima p/ baixo: cabeçalho → filtros recolhíveis → 2 gráficos → tabela-matriz.
 *
 * Os rótulos de mês (eixo/tabela/CSV) vêm PRONTOS e VÁLIDOS da ViewModel (`formatMonthLabel`, derivado por
 * ÍNDICE de mês) — NUNCA "Invalid Date" (bug do relatório legado que não reproduzimos). CSV pela ViewModel
 * (Blob); PDF via window.print() (dentro do `report-export-dropdown`).
 */
import { useMemo, useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { screen } from '#shared/ui/brand/brand-page.css.ts'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon } from '#shared/ui/index.ts'

import {
  loadAnalise,
  totalByCostCenter,
  totalByMonth,
  buildCsv,
  formatBRL,
  formatBRLShort,
  formatPercent,
  formatMonthLabel,
  sharePercent,
} from '../analise.view-model.ts'
import { ReportExportDropdown } from '../components/report-export-dropdown.component.tsx'
import { exportTrigger } from '../components/report-filters.css.ts'
import {
  RealizadoCostCenterBars,
  type CostCenterBar,
} from '../components/realizado-cost-center-bars.component.tsx'
import { AnaliseMonthlyBars, type MonthlyBar } from '../components/analise-monthly-bars.component.tsx'
import { RealizadoChartsMount } from '../components/realizado-charts-mount.component.tsx'
import { AnaliseTable } from '../components/analise-table.component.tsx'
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
  charts2,
} from './analise-pagamentos.page.css.ts'

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

export function AnalisePagamentosPage(): ReactNode {
  // ÚNICO UI-state da page: filtros abertos/fechados.
  const [filtersOpen, setFiltersOpen] = useState(false)

  const report = useMemo(() => loadAnalise('p'), [])
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
      {/* Cabeçalho: voltar + título + Filtros/Exportar */}
      <div className={head}>
        <button
          type="button"
          className={backButton}
          aria-label={t('reports.analise.back')}
          onClick={() => {
            window.history.back()
          }}
        >
          <ChevronLeftIcon size={18} />
        </button>
        <h1 className={headTitle}>{t('reports.analise.title')}</h1>
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
            {t('reports.analise.filters.title')}
          </button>
          <ReportExportDropdown
            triggerClassName={exportTrigger}
            exportLabel={t('reports.analise.export.label')}
            csvLabel={t('reports.analise.export.csv')}
            pdfLabel={t('reports.analise.export.pdf')}
            onExportCsv={() => {
              downloadCsv('analise-pagamentos.csv', buildCsv(report))
            }}
          />
        </div>
      </div>

      {/* Filtros recolhíveis (placeholders visuais front-first) */}
      <div className={filtersOpen ? filters.open : filters.closed}>
        <div className={filtersInner}>
          <FilterField label={t('reports.analise.filters.programa')} options={['PARC', 'ETI', 'EPV']} />
          <FilterField
            label={t('reports.analise.filters.plano')}
            options={[t('reports.analise.filters.allOption')]}
          />
          <FilterField
            label={t('reports.analise.filters.periodo')}
            options={[t('reports.analise.filters.allOption')]}
          />
          <FilterField
            label={t('reports.analise.filters.conta')}
            options={[t('reports.analise.filters.allOption')]}
          />
          {/* Status alinhados ao Contas a Pagar (os que o backend produz): reusa os rótulos dos chips do CAP. */}
          <FilterField
            label={t('reports.analise.filters.status')}
            options={[
              t('reports.analise.filters.allOption'),
              t('financial.list.chip.rascunho'),
              t('financial.list.chip.aberto'),
              t('financial.list.chip.aprovado'),
              t('financial.list.chip.pago'),
              t('financial.list.chip.conciliado'),
            ]}
          />
          <FilterField
            label={t('reports.analise.filters.centro')}
            options={[t('reports.analise.filters.allOption')]}
          />
          <FilterField
            label={t('reports.analise.filters.categoria')}
            options={[t('reports.analise.filters.allOption')]}
          />
          <FilterField
            label={t('reports.analise.filters.subcategoria')}
            options={[t('reports.analise.filters.allOption')]}
          />
          <button type="button" className={applyButton}>
            {t('reports.analise.filters.filtrar')}
          </button>
        </div>
      </div>

      {/* 2 gráficos (animação de entrada gerida pelo mount wrapper) */}
      <RealizadoChartsMount>
        {(animate) => (
          <div className={charts2}>
            <div className={chartCard}>
              <div className={cardHeader}>
                <h2 className={cardTitle}>{t('reports.analise.charts.byCostCenter')}</h2>
              </div>
              <div className={chartPad}>
                <RealizadoCostCenterBars
                  bars={costCenterBars}
                  emptyLabel={t('reports.analise.empty')}
                  animate={animate}
                />
              </div>
            </div>

            <div className={chartCard}>
              <div className={cardHeader}>
                <h2 className={cardTitle}>{t('reports.analise.charts.monthly')}</h2>
              </div>
              <div className={chartPad}>
                <AnaliseMonthlyBars
                  bars={monthlyBars}
                  totalCents={report.totalPeriodo}
                  emptyLabel={t('reports.analise.empty')}
                  animate={animate}
                  formatValue={formatBRLShort}
                  formatShare={(v, tot) => formatPercent(sharePercent(v, tot))}
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
          cardTitle: t('reports.analise.table.title'),
          nameCol: t('reports.analise.columns.name'),
          totalCol: t('reports.analise.columns.total'),
          totalRow: t('reports.analise.totals.row'),
          expand: t('reports.analise.tree.expand'),
          collapse: t('reports.analise.tree.collapse'),
          prevMonths: t('reports.analise.pager.prev'),
          nextMonths: t('reports.analise.pager.next'),
        }}
      />
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
