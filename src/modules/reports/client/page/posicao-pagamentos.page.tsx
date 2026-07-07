/**
 * PosicaoPagamentosPage — tela do relatório "Posição de Pagamentos" (identidade "brand", full-bleed 28px), no
 * MOLDE do relatório "Realizado × Planejado": cabeçalho → filtros recolhíveis → 4 KPIs → 2 gráficos → tabela
 * hierárquica. Front-first: os dados vêm de constantes placeholder SINTÉTICAS (ver
 * `posicao-pagamentos.placeholder.ts`); o endpoint do core-api (#114) ainda não existe. A ViewModel PURA faz
 * TODA a agregação/derivação (folha → CC → fornecedor → Total Geral + as 3 medidas + o total por fornecedor);
 * a page só compõe as views burras e guarda o ÚNICO UI-state local: o toggle dos filtros.
 *
 * As 3 medidas são DERIVADAS do estado real do Contas a Pagar (Em atraso = não pago e vencido; Pago =
 * liquidado; A pagar = não pago e a vencer); o Total é a soma. Export = CSV (Blob) + PDF (window.print) pelo
 * dropdown. Os filtros (selects) são PLACEHOLDERS visuais (front-first) — não filtram nada ainda.
 *
 * ── ENGINE REUTILIZÁVEL ── quando o Contas a Receber subir, `loadPosicao('r')` renderiza "Posição de
 * Recebíveis" com a MESMA tela e agregação — só a fonte e os rótulos de nível mudam. Aqui só `type: 'p'`.
 */
import { useMemo, useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { screen } from '#shared/ui/brand/brand-page.css.ts'
import { ChevronLeftIcon, ChevronDownIcon, FilterIcon } from '#shared/ui/index.ts'

import {
  loadPosicao,
  buildCsv,
  supplierTotals,
  measureTotal,
  formatBRL,
  formatBRLShort,
  formatPercent,
  sharePercent,
} from '../posicao.view-model.ts'
import { ReportExportDropdown } from '../components/report-export-dropdown.component.tsx'
import { exportTrigger } from '../components/report-filters.css.ts'
import { PosicaoKpis } from '../components/posicao-kpis.component.tsx'
import {
  RealizadoCostCenterBars,
  type CostCenterBar,
} from '../components/realizado-cost-center-bars.component.tsx'
import { RealizadoDonut, type DonutSlice } from '../components/realizado-donut.component.tsx'
import { RealizadoChartsMount } from '../components/realizado-charts-mount.component.tsx'
import { PosicaoTreeTable } from '../components/posicao-tree-table.component.tsx'
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
} from './posicao-pagamentos.page.css.ts'

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

const ALL = (): string => t('reports.posicao.filters.allOption')

export function PosicaoPagamentosPage(): ReactNode {
  // ÚNICO UI-state da page: filtros abertos/fechados.
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Fonte da tela: Pagamentos ('p'). A árvore agregada já traz subtotais por nó + os totais gerais.
  const report = useMemo(() => loadPosicao('p'), [])
  const totals = report.totals
  const grandTotal = measureTotal(totals)

  // Donut "Resumo total" — 3 fatias na ordem A pagar → Pago → Em atraso (cores próprias da Posição).
  const donutSlices: readonly DonutSlice[] = useMemo(
    () => [
      {
        id: 'aPagar',
        label: t('reports.posicao.measure.aPagar'),
        valueCents: totals.aPagarCents,
        measureKey: 'aPagar',
      },
      {
        id: 'pago',
        label: t('reports.posicao.measure.pago'),
        valueCents: totals.pagoCents,
        measureKey: 'pago',
      },
      {
        id: 'emAtraso',
        label: t('reports.posicao.measure.emAtraso'),
        valueCents: totals.emAtrasoCents,
        measureKey: 'emAtraso',
      },
    ],
    [totals.aPagarCents, totals.pagoCents, totals.emAtrasoCents],
  )

  // Barras "Distribuição por Fornecedor" — total por fornecedor (desc); largura = % do total geral.
  const supplierBars: readonly CostCenterBar[] = useMemo(
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
      {/* Cabeçalho: voltar + título + Filtros/Exportar */}
      <div className={head}>
        <button
          type="button"
          className={backButton}
          aria-label={t('reports.posicao.back')}
          onClick={() => {
            window.history.back()
          }}
        >
          <ChevronLeftIcon size={18} />
        </button>
        <h1 className={headTitle}>{t('reports.posicao.title')}</h1>
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
            {t('reports.posicao.filters.title')}
          </button>
          <ReportExportDropdown
            triggerClassName={exportTrigger}
            exportLabel={t('reports.posicao.export.label')}
            csvLabel={t('reports.posicao.export.csv')}
            pdfLabel={t('reports.posicao.export.pdf')}
            onExportCsv={() => {
              downloadCsv('posicao-pagamentos.csv', buildCsv(report))
            }}
          />
        </div>
      </div>

      {/* Filtros recolhíveis (placeholders visuais front-first) */}
      <div className={filtersOpen ? filters.open : filters.closed}>
        <div className={filtersInner}>
          <FilterField label={t('reports.posicao.filters.plano')} options={[ALL()]} />
          <FilterField label={t('reports.posicao.filters.periodo')} options={[ALL()]} />
          <FilterField label={t('reports.posicao.filters.conta')} options={[ALL()]} />
          <FilterField label={t('reports.posicao.filters.status')} options={[ALL()]} />
          <FilterField label={t('reports.posicao.filters.centro')} options={[ALL()]} />
          <FilterField label={t('reports.posicao.filters.categoria')} options={[ALL()]} />
          <FilterField label={t('reports.posicao.filters.subcategoria')} options={[ALL()]} />
          <FilterField label={t('reports.posicao.filters.fornecedor')} options={[ALL()]} />
          <button type="button" className={applyButton}>
            {t('reports.posicao.filters.filtrar')}
          </button>
        </div>
      </div>

      {/* 4 KPIs (Atrasado/Pago/A pagar/Total) */}
      <PosicaoKpis
        atrasadoValue={formatBRL(totals.emAtrasoCents)}
        pagoValue={formatBRL(totals.pagoCents)}
        aPagarValue={formatBRL(totals.aPagarCents)}
        totalValue={formatBRL(grandTotal)}
        labels={{
          atrasado: t('reports.posicao.kpi.atrasado'),
          pago: t('reports.posicao.kpi.pago'),
          aPagar: t('reports.posicao.kpi.aPagar'),
          total: t('reports.posicao.kpi.total'),
          atrasadoSub: t('reports.posicao.kpi.atrasadoSub'),
          pagoSub: t('reports.posicao.kpi.pagoSub'),
          aPagarSub: t('reports.posicao.kpi.aPagarSub'),
          totalSub: t('reports.posicao.kpi.totalSub'),
        }}
      />

      {/* 2 gráficos (animação de entrada gerida pelo mount wrapper) */}
      <RealizadoChartsMount>
        {(animate) => (
          <div className={charts2}>
            <div className={chartCard}>
              <div className={cardHeader}>
                <h2 className={cardTitle}>{t('reports.posicao.chart.resumoTotal')}</h2>
              </div>
              <div className={chartPad}>
                <RealizadoDonut
                  slices={donutSlices}
                  centerValue={formatBRLShort(grandTotal)}
                  centerCaption={t('reports.posicao.chart.centerCaption')}
                  emptyLabel={t('reports.posicao.empty')}
                  animate={animate}
                  formatValue={formatBRLShort}
                  formatPercent={formatPercent}
                />
              </div>
            </div>

            <div className={chartCard}>
              <div className={cardHeader}>
                <h2 className={cardTitle}>{t('reports.posicao.chart.distribuicaoFornecedor')}</h2>
              </div>
              <div className={chartPad}>
                <RealizadoCostCenterBars
                  bars={supplierBars}
                  emptyLabel={t('reports.posicao.empty')}
                  animate={animate}
                />
              </div>
            </div>
          </div>
        )}
      </RealizadoChartsMount>

      {/* Tabela hierárquica (Fornecedor → CC → Categoria) + Total Geral */}
      <PosicaoTreeTable
        report={report}
        labels={{
          cardTitle: t('reports.posicao.table.title'),
          nameCol: t('reports.posicao.columns.name'),
          measureLabels: {
            emAtrasoCents: t('reports.posicao.measure.emAtraso'),
            pagoCents: t('reports.posicao.measure.pago'),
            aPagarCents: t('reports.posicao.measure.aPagar'),
          },
          totalRow: t('reports.posicao.totals.row'),
          expand: t('reports.posicao.tree.expand'),
          collapse: t('reports.posicao.tree.collapse'),
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
