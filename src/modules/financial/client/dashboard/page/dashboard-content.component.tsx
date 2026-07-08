/**
 * DashboardContent — view BURRA (§XI) do corpo do Dashboard "Resumo Mensal". Recebe o `DashboardStatistics`
 * (server-state composto pelo BFF — 052) + o `RecentPaymentsView` (042) por PROPS e só apresenta as 2 linhas:
 *  - linha 1: 4 MetricCard (do DTO);
 *  - linha 2 (2 colunas): ESQUERDA "Visão geral" (LineChart do DTO) + RecentPaymentsWidget; DIREITA donut
 *    por centro de custo (do DTO) + fornecedores sem contrato (barras derivadas puras do DTO).
 * Deriva as props via funções PURAS do view-model (nada de fetch aqui). i18n PT via `createTranslator`.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import type { RecentPaymentsView } from '../recent-payments.binding.ts'
import { RecentPaymentsWidget } from '../components/recent-payments-widget.component.tsx'
import { MetricCard } from '../components/metric-card.component.tsx'
import { LineChart } from '../components/line-chart.component.tsx'
import { DonutChart } from '../components/donut-chart.component.tsx'
import {
  SuppliersWithoutContractCard,
  type SupplierBar,
} from '../components/suppliers-without-contract-card.component.tsx'
import {
  toMetricCards,
  toChartSeries,
  toDonutSlices,
  deriveSupplierComplianceBars,
  formatSupplierBRL,
  formatSupplierPercent,
  type DashboardStatistics,
} from '../dashboard-summary.view-model.ts'
import {
  metricsRow,
  contentRow,
  overviewCard,
  overviewHeader,
  overviewTitles,
  overviewTitle,
  overviewLegend,
  legendForecast,
  legendRealized,
  legendSep,
  seeAllLink,
  costCenterCard,
  costCenterTitle,
  leftColumn,
  rightColumn,
} from './dashboard.css.ts'

const t = createTranslator(ptBR)

// Rótulos dos meses (Jan..Dez) — eixo X do gráfico.
const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const

export type DashboardContentProps = Readonly<{
  data: DashboardStatistics
  recent: RecentPaymentsView
  /** Anima a entrada das barras de compliance (largura cresce quando true). */
  animate: boolean
}>

export function DashboardContent(props: DashboardContentProps): ReactNode {
  const { data, recent } = props

  const metricCards = toMetricCards(data)
  const chartSeries = toChartSeries(data)
  const donutSlices = toDonutSlices(data)

  // Barras de compliance: derivadas (puro) do DTO e mapeadas p/ a view burra (textos formatados). Preview: até 6.
  const supplierBars: readonly SupplierBar[] = deriveSupplierComplianceBars(
    data.suppliersWithoutContract,
    data.dispenseLimitCents,
  ).map(
    (b): SupplierBar => ({
      id: b.id,
      name: b.name,
      utilizadoPct: b.utilizadoPct,
      status: b.status,
      percentLabel: formatSupplierPercent(b.utilizadoPct),
      valueLabel: formatSupplierBRL(b.valorTotalCents),
    }),
  )

  return (
    <>
      {/* Linha 1 — 4 cards de métrica */}
      <div className={metricsRow}>
        {metricCards.map((m) => (
          <MetricCard
            key={m.id}
            label={t(m.labelKey)}
            value={m.value}
            trendPercent={m.trendPercent}
            trendLabel={t(m.trendLabelKey)}
            accent={m.accent}
            icon={m.icon}
          />
        ))}
      </div>

      {/* Linha 2 — esquerda (2/3): "Visão geral" + "Últimos pagamentos"; direita (1/3): donut + fornecedores */}
      <div className={contentRow}>
        <div className={leftColumn}>
          <section className={overviewCard} aria-label={t('dashboard.overview.title')}>
            <div className={overviewHeader}>
              <div className={overviewTitles}>
                <h2 className={overviewTitle}>{t('dashboard.overview.title')}</h2>
                {/* Legenda única (no topo): Previsto ciano × Realizado verde */}
                <p className={overviewLegend}>
                  <span className={legendForecast}>{t('dashboard.chart.series.forecast')}</span>
                  <span className={legendSep}>×</span>
                  <span className={legendRealized}>{t('dashboard.chart.series.realized')}</span>
                </p>
              </div>
              <button type="button" className={seeAllLink}>
                {t('dashboard.overview.see-all')}
              </button>
            </div>
            <LineChart
              series={chartSeries}
              yMax={data.chart.yMax}
              yTicks={data.chart.yTicks}
              months={data.chart.months}
              monthLabels={MONTH_LABELS}
              seriesLabel={(s) => t(s.labelKey)}
            />
          </section>

          {/* "Últimos pagamentos realizados" (dados REAIS, 042) — embaixo do gráfico, como no legado */}
          <RecentPaymentsWidget status={recent.status} rows={recent.rows} t={t} />
        </div>

        <div className={rightColumn}>
          <section className={costCenterCard} aria-label={t('dashboard.cost-center.title')}>
            <h2 className={costCenterTitle}>{t('dashboard.cost-center.title')}</h2>
            <DonutChart
              slices={donutSlices}
              emptyLabel={t('dashboard.cost-center.empty')}
              sliceLabel={(sl) => t(sl.labelKey)}
            />
          </section>

          <SuppliersWithoutContractCard
            title={t('dashboard.suppliers-no-contract.title')}
            seeAllLabel={t('dashboard.suppliers-no-contract.see-all')}
            emptyLabel={t('dashboard.suppliers-no-contract.empty')}
            bars={supplierBars}
            animate={props.animate}
          />
        </div>
      </div>
    </>
  )
}
