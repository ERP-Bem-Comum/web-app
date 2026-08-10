/**
 * SuppliersWithoutContractPage — tela do relatório "Fornecedores sem Contrato" (identidade "brand",
 * full-bleed 28px, padrão do grid de Colaboradores). Front-first: os dados vêm de constantes placeholder
 * (core-api#114 ainda não existe). UI-state local: o toggle **Filtros** (abre/fecha o painel) e o input
 * **Limite** (dirige a matemática da tabela E do gráfico). O resto é derivação PURA via ViewModel. O gráfico
 * de compliance ("Utilização do limite por fornecedor") fica ENTRE os filtros e a tabela. CSV via ViewModel
 * (Blob, client-side); PDF via window.print(). View burra: sem cálculo aqui.
 */
import { useMemo, useState, type ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { screen, header, headText, headTitle, headSubtitle } from '#shared/ui/brand/brand-page.css.ts'
import { FilterIcon } from '#shared/ui/index.ts'

import {
  aggregateSuppliers,
  buildCsv,
  parseLimiteToCents,
  formatLimiteInput,
  formatPercent,
  formatBRL,
  topSuppliersByValor,
  complianceCounts,
  LIMITE_DEFAULT_CENTS,
  type RawSupplierRow,
} from '../suppliers-without-contract.view-model.ts'
import { useSuppliersWithoutContract } from '../suppliers-without-contract.binding.ts'
import { ReportStatePanel } from '../components/report-state-panel.component.tsx'
import { ReportFilters } from '../components/report-filters.component.tsx'
import { exportTrigger } from '../components/report-filters.css.ts'
import { ReportExportDropdown } from '../components/report-export-dropdown.component.tsx'
import { SupplierTreeTable } from '../components/supplier-tree-table.component.tsx'
import {
  SupplierComplianceBars,
  type ComplianceBar,
  type ComplianceStatus,
} from '../components/supplier-compliance-bars.component.tsx'
import { RealizadoChartsMount } from '../components/realizado-charts-mount.component.tsx'
import {
  tools,
  filterToggle,
  filters,
  chartCard,
  cardHeader,
  cardTitle,
  cardSummary,
  chartPad,
  legend,
  legendItem,
  legendDot,
  legendDotStatus,
} from './suppliers-without-contract.page.css.ts'

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

/** Quantos fornecedores mostrar no gráfico (top por valor). */
const CHART_TOP_N = 8

/** Mapeia os flags já derivados (fonte única) para o status de cor do gráfico. */
function statusOf(row: { overLimit: boolean; atLimit: boolean }): ComplianceStatus {
  if (row.overLimit) return 'over'
  if (row.atLimit) return 'at'
  return 'within'
}

/** Linhas cruas vazias enquanto a query carrega/falha (mantém a ordem dos hooks estável — §XI). */
const EMPTY_RAW: readonly RawSupplierRow[] = []

export function SuppliersWithoutContractPage(): ReactNode {
  // Server-state REAL do core-api (#114): fornecedores agregados (sem quebra por plano — D2). O LIMITE é
  // UI-state reativo → a agregação por limite acontece AQUI (não no binding), preservando a matemática ao vivo.
  const state = useSuppliersWithoutContract()

  // UI-state: painel de filtros aberto/fechado.
  const [filtersOpen, setFiltersOpen] = useState(false)
  // UI-state: o texto do input Limite. Inicia no padrão R$ 10.000,00 → "10.000,00".
  const [limiteText, setLimiteText] = useState(() => formatLimiteInput(LIMITE_DEFAULT_CENTS))

  const limiteCents = parseLimiteToCents(limiteText)
  // Todos os hooks rodam ANTES de qualquer return (regras de hooks): sem dado ainda → linhas vazias.
  const rawRows = state.status === 'ready' ? state.rawRows : EMPTY_RAW
  const rows = useMemo(() => aggregateSuppliers(rawRows, limiteCents), [rawRows, limiteCents])

  // Barras do gráfico: top-N por valor, já mapeadas para a view burra (nome + status + % formatado).
  const chartBars: readonly ComplianceBar[] = useMemo(
    () =>
      topSuppliersByValor(rows, CHART_TOP_N).map(
        (r): ComplianceBar => ({
          id: r.supplier,
          name: r.supplier,
          utilizadoPct: r.utilizadoPct,
          status: statusOf(r),
          valueLabel: formatPercent(r.utilizadoPct),
          valueTitle: formatBRL(r.valorTotalCents),
        }),
      ),
    [rows],
  )

  const counts = useMemo(() => complianceCounts(rows), [rows])

  if (state.status === 'loading') {
    return <ReportStatePanel title={t('reports.suppliersWithoutContract.loading')} />
  }
  if (state.status === 'error') {
    return (
      <ReportStatePanel
        role="alert"
        title={t('reports.suppliersWithoutContract.errorTitle')}
        hint={t(state.errorTag)}
      />
    )
  }

  return (
    <div className={screen}>
      <div className={header}>
        <div className={headText}>
          <h1 className={headTitle}>{t('reports.suppliersWithoutContract.title')}</h1>
          <p className={headSubtitle}>{t('reports.suppliersWithoutContract.subtitle')}</p>
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
            {t('reports.suppliersWithoutContract.filters.title')}
          </button>
          <ReportExportDropdown
            triggerClassName={exportTrigger}
            exportLabel={t('reports.suppliersWithoutContract.export.label')}
            csvLabel={t('reports.suppliersWithoutContract.export.csv')}
            pdfLabel={t('reports.suppliersWithoutContract.export.pdf')}
            onExportCsv={() => {
              downloadCsv('fornecedores-sem-contrato.csv', buildCsv(rows))
            }}
          />
        </div>
      </div>

      {/* Filtros recolhíveis (fechados por padrão) — o Limite ativo vive aqui dentro. */}
      <div className={filtersOpen ? filters.open : filters.closed}>
        <ReportFilters
          limiteValue={limiteText}
          onLimiteChange={setLimiteText}
          labels={{
            advancedTitle: t('reports.suppliersWithoutContract.filters.title'),
            advancedSubtitle: t('reports.suppliersWithoutContract.filters.subtitle'),
            programa: t('reports.suppliersWithoutContract.filters.programa'),
            plano: t('reports.suppliersWithoutContract.filters.plano'),
            periodo: t('reports.suppliersWithoutContract.filters.periodo'),
            limite: t('reports.suppliersWithoutContract.filters.limite'),
            centro: t('reports.suppliersWithoutContract.filters.centro'),
            categoria: t('reports.suppliersWithoutContract.filters.categoria'),
            subcategoria: t('reports.suppliersWithoutContract.filters.subcategoria'),
            allOption: t('reports.suppliersWithoutContract.filters.allOption'),
            filtrar: t('reports.suppliersWithoutContract.filters.filtrar'),
          }}
        />
      </div>

      {/* Gráfico de compliance ("Utilização do limite por fornecedor") — ENTRE filtros e tabela. */}
      <div className={chartCard}>
        <div className={cardHeader}>
          <h2 className={cardTitle}>{t('reports.suppliersWithoutContract.chart.title')}</h2>
          <span className={cardSummary}>
            {t('reports.suppliersWithoutContract.chart.summary')
              .replace('{{total}}', String(counts.total))
              .replace('{{over}}', String(counts.overLimit))}
          </span>
        </div>
        <div className={cardHeader}>
          <ul className={legend}>
            <li className={legendItem}>
              <span className={`${legendDot} ${legendDotStatus.within}`} />
              {t('reports.suppliersWithoutContract.chart.legend.within')}
            </li>
            <li className={legendItem}>
              <span className={`${legendDot} ${legendDotStatus.at}`} />
              {t('reports.suppliersWithoutContract.chart.legend.atLimit')}
            </li>
            <li className={legendItem}>
              <span className={`${legendDot} ${legendDotStatus.over}`} />
              {t('reports.suppliersWithoutContract.chart.legend.over')}
            </li>
          </ul>
        </div>
        <div className={chartPad}>
          <RealizadoChartsMount>
            {(animate) => (
              <SupplierComplianceBars
                bars={chartBars}
                emptyLabel={t('reports.suppliersWithoutContract.empty')}
                animate={animate}
              />
            )}
          </RealizadoChartsMount>
        </div>
      </div>

      <SupplierTreeTable
        rows={rows}
        labels={{
          supplier: t('reports.suppliersWithoutContract.columns.supplier'),
          valorTotal: t('reports.suppliersWithoutContract.columns.valorTotal'),
          utilizado: t('reports.suppliersWithoutContract.columns.utilizado'),
          restante: t('reports.suppliersWithoutContract.columns.restante'),
          expand: t('reports.suppliersWithoutContract.tree.expand'),
          collapse: t('reports.suppliersWithoutContract.tree.collapse'),
          empty: t('reports.suppliersWithoutContract.empty'),
        }}
      />
    </div>
  )
}
