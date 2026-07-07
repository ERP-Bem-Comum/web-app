/**
 * PosicaoReportView — CORPO compartilhado dos relatórios de "Posição" (Pagamentos 'p' e Recebimentos 'r').
 * View de composição BURRA: recebe o relatório JÁ AGREGADO (ViewModel pura `loadPosicao(type)`) + TODOS os
 * rótulos por props (i18n resolvido nas pages) e monta cabeçalho → filtros recolhíveis → 4 KPIs → 2 gráficos →
 * tabela hierárquica. NÃO deriva domínio nem toca a `data/`; o único UI-state local é o toggle dos filtros
 * (a expansão da árvore é UI-state da própria PosicaoTreeTable). As pages 'p'/'r' são wrappers finos que só
 * escolhem a fonte e os rótulos — ZERO duplicação de composição (ADR-0009, §XI).
 *
 * ── EMPTY STATE HONESTO ── quando o relatório vem VAZIO (0 nós / total 0), renderiza SÓ o cabeçalho + um
 * painel único com a mensagem (`labels.empty`) — sem KPIs/gráficos/tabela quebrados. É o caminho para o qual
 * a Posição de Recebimentos cai quando o placeholder for removido (fonte retorna `[]`).
 */
import { useMemo, useState, type ReactNode } from 'react'

import { screen } from '#shared/ui/brand/brand-page.css.ts'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon } from '#shared/ui/index.ts'

import {
  buildCsv,
  supplierTotals,
  measureTotal,
  formatBRL,
  formatBRLShort,
  formatPercent,
  sharePercent,
  type PosicaoReport,
} from '../posicao.view-model.ts'
import { ReportExportDropdown } from './report-export-dropdown.component.tsx'
import { exportTrigger } from './report-filters.css.ts'
import { PosicaoKpis } from './posicao-kpis.component.tsx'
import { RealizadoCostCenterBars, type CostCenterBar } from './realizado-cost-center-bars.component.tsx'
import { RealizadoDonut, type DonutSlice } from './realizado-donut.component.tsx'
import { RealizadoChartsMount } from './realizado-charts-mount.component.tsx'
import { PosicaoTreeTable } from './posicao-tree-table.component.tsx'
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
  card,
  emptyPanel,
  emptyTitle,
  emptyHint,
} from '../page/posicao-pagamentos.page.css.ts'

/** Todos os rótulos i18n do relatório, resolvidos na page (Pagamentos vs Recebimentos). */
export type PosicaoReportViewLabels = Readonly<{
  back: string
  title: string
  filters: Readonly<{
    title: string
    allOption: string
    plano: string
    periodo: string
    conta: string
    status: string
    centro: string
    categoria: string
    subcategoria: string
    /** Fornecedor (Pagamentos) | Financiador (Recebimentos). */
    partner: string
    filtrar: string
  }>
  export: Readonly<{ label: string; csv: string; pdf: string }>
  kpi: Readonly<{
    atrasado: string
    pago: string
    aPagar: string
    total: string
    atrasadoSub: string
    pagoSub: string
    aPagarSub: string
    totalSub: string
  }>
  measure: Readonly<{ emAtraso: string; pago: string; aPagar: string }>
  chart: Readonly<{ resumoTotal: string; distribuicao: string; centerCaption: string }>
  table: Readonly<{ title: string; nameCol: string; totalRow: string; expand: string; collapse: string }>
  /** Mensagem do empty state honesto (relatório vazio). */
  empty: string
  /** Complemento (2ª linha) do empty state. */
  emptyHint: string
  /** Fallback interno dos gráficos (donut/barras) quando SEM fatias — só no caminho não-vazio. */
  chartEmptyLabel: string
}>

export type PosicaoReportViewProps = Readonly<{
  report: PosicaoReport
  labels: PosicaoReportViewLabels
  /** Nome do arquivo CSV baixado (ex.: "posicao-recebimentos.csv"). */
  csvFilename: string
  /** Header pt-BR do CSV (Pagamentos vs Recebimentos). */
  csvHeader: string
  /** Cor dos gráficos (donut + barras): `'pag'` (padrão) ou `'rec'` (paleta distinta da Posição de Recebimentos). */
  chartTone?: 'pag' | 'rec'
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

export function PosicaoReportView(props: PosicaoReportViewProps): ReactNode {
  const { report, labels: L, csvFilename, csvHeader } = props
  const isRec = props.chartTone === 'rec'
  // ÚNICO UI-state local: filtros abertos/fechados.
  const [filtersOpen, setFiltersOpen] = useState(false)

  const totals = report.totals
  const grandTotal = measureTotal(totals)
  // Empty state honesto: sem raízes OU total zero → nada a exibir (a fonte veio vazia/zerada).
  const isEmpty = report.suppliers.length === 0 || grandTotal === 0

  // Donut "Resumo total" — 3 fatias na ordem A pagar/receber → Pago/Recebido → Em atraso.
  const donutSlices: readonly DonutSlice[] = useMemo(
    () => [
      {
        id: 'aPagar',
        label: L.measure.aPagar,
        valueCents: totals.aPagarCents,
        measureKey: isRec ? 'aReceber' : 'aPagar',
      },
      {
        id: 'pago',
        label: L.measure.pago,
        valueCents: totals.pagoCents,
        measureKey: isRec ? 'recebido' : 'pago',
      },
      {
        id: 'emAtraso',
        label: L.measure.emAtraso,
        valueCents: totals.emAtrasoCents,
        measureKey: isRec ? 'emAtrasoRec' : 'emAtraso',
      },
    ],
    [
      isRec,
      L.measure.aPagar,
      L.measure.pago,
      L.measure.emAtraso,
      totals.aPagarCents,
      totals.pagoCents,
      totals.emAtrasoCents,
    ],
  )

  // Barras "Distribuição por Fornecedor/Financiador" — total por raiz (desc); largura = % do total geral.
  const partnerBars: readonly CostCenterBar[] = useMemo(
    () =>
      supplierTotals(report).map((s): CostCenterBar => {
        const share = sharePercent(s.valueCents, grandTotal)
        return {
          id: s.id,
          label: s.name,
          sharePct: share,
          high: false,
          percentLabel: formatPercent(share),
          valueTitle: formatBRL(s.valueCents),
        }
      }),
    [report, grandTotal],
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
        <h1 className={headTitle}>{L.title}</h1>
        {!isEmpty && (
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
            <ReportExportDropdown
              triggerClassName={exportTrigger}
              exportLabel={L.export.label}
              csvLabel={L.export.csv}
              pdfLabel={L.export.pdf}
              onExportCsv={() => {
                downloadCsv(csvFilename, buildCsv(report, csvHeader))
              }}
            />
          </div>
        )}
      </div>

      {isEmpty ? (
        // Empty state HONESTO: um cartão único, sem KPIs/gráficos/tabela.
        <div className={card}>
          <div className={emptyPanel}>
            <p className={emptyTitle}>{L.empty}</p>
            <p className={emptyHint}>{L.emptyHint}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Filtros recolhíveis (placeholders visuais front-first) */}
          <div className={filtersOpen ? filters.open : filters.closed}>
            <div className={filtersInner}>
              <FilterField label={L.filters.plano} options={[L.filters.allOption]} />
              <FilterField label={L.filters.periodo} options={[L.filters.allOption]} />
              <FilterField label={L.filters.conta} options={[L.filters.allOption]} />
              <FilterField label={L.filters.status} options={[L.filters.allOption]} />
              <FilterField label={L.filters.centro} options={[L.filters.allOption]} />
              <FilterField label={L.filters.categoria} options={[L.filters.allOption]} />
              <FilterField label={L.filters.subcategoria} options={[L.filters.allOption]} />
              <FilterField label={L.filters.partner} options={[L.filters.allOption]} />
              <button type="button" className={applyButton}>
                {L.filters.filtrar}
              </button>
            </div>
          </div>

          {/* 4 KPIs (Atrasado / Pago-Recebido / A pagar-A receber / Total) */}
          <PosicaoKpis
            atrasadoValue={formatBRL(totals.emAtrasoCents)}
            pagoValue={formatBRL(totals.pagoCents)}
            aPagarValue={formatBRL(totals.aPagarCents)}
            totalValue={formatBRL(grandTotal)}
            labels={{
              atrasado: L.kpi.atrasado,
              pago: L.kpi.pago,
              aPagar: L.kpi.aPagar,
              total: L.kpi.total,
              atrasadoSub: L.kpi.atrasadoSub,
              pagoSub: L.kpi.pagoSub,
              aPagarSub: L.kpi.aPagarSub,
              totalSub: L.kpi.totalSub,
            }}
          />

          {/* 2 gráficos (animação de entrada gerida pelo mount wrapper) */}
          <RealizadoChartsMount>
            {(animate) => (
              <div className={charts2}>
                <div className={chartCard}>
                  <div className={cardHeader}>
                    <h2 className={cardTitle}>{L.chart.resumoTotal}</h2>
                  </div>
                  <div className={chartPad}>
                    <RealizadoDonut
                      slices={donutSlices}
                      centerValue={formatBRLShort(grandTotal)}
                      centerCaption={L.chart.centerCaption}
                      emptyLabel={L.chartEmptyLabel}
                      animate={animate}
                      formatValue={formatBRLShort}
                      formatPercent={formatPercent}
                    />
                  </div>
                </div>

                <div className={chartCard}>
                  <div className={cardHeader}>
                    <h2 className={cardTitle}>{L.chart.distribuicao}</h2>
                  </div>
                  <div className={chartPad}>
                    <RealizadoCostCenterBars
                      bars={partnerBars}
                      emptyLabel={L.chartEmptyLabel}
                      animate={animate}
                      fillTone={isRec ? 'rec' : undefined}
                    />
                  </div>
                </div>
              </div>
            )}
          </RealizadoChartsMount>

          {/* Tabela hierárquica (raiz → CC → Categoria) + Total Geral */}
          <PosicaoTreeTable
            report={report}
            labels={{
              cardTitle: L.table.title,
              nameCol: L.table.nameCol,
              measureLabels: {
                emAtrasoCents: L.measure.emAtraso,
                pagoCents: L.measure.pago,
                aPagarCents: L.measure.aPagar,
              },
              totalRow: L.table.totalRow,
              expand: L.table.expand,
              collapse: L.table.collapse,
            }}
          />
        </>
      )}
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
