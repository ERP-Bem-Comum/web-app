/**
 * DashboardPage — reprodução fiel do Dashboard legado "Dashboard - Resumo Mensal" (043). View burra (§XI):
 * compõe o layout em 2 linhas a partir do view-model PURO (placeholder) + do binding real do widget 042.
 *  - linha 1: 4 MetricCard (placeholder);
 *  - linha 2 (2 colunas):
 *      · ESQUERDA: card "Visão geral" (Previsto x Realizado) com LineChart + RecentPaymentsWidget (REAL, 042);
 *      · DIREITA: DonutChart vazio (topo) + SuppliersWithoutContractCard com lista (embaixo).
 * i18n PT via `createTranslator` (nada hardcoded). Placeholder pronto p/ ligar (core-api#112).
 */
import { useEffect, useMemo, useState } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { header, headText, headTitle, headSubtitle } from '#shared/ui/brand/brand-page.css.ts'

import { useRecentPayments } from '../recent-payments.binding.ts'
import { RecentPaymentsWidget } from '../components/recent-payments-widget.component.tsx'
import { MetricCard } from '../components/metric-card.component.tsx'
import { LineChart } from '../components/line-chart.component.tsx'
import { DonutChart } from '../components/donut-chart.component.tsx'
import {
  SuppliersWithoutContractCard,
  type SupplierBar,
} from '../components/suppliers-without-contract-card.component.tsx'
import {
  METRIC_CARDS,
  CHART_SERIES,
  CHART_Y_MAX,
  CHART_Y_TICKS,
  CHART_MONTHS,
  DONUT_SLICES,
  SUPPLIERS_WITHOUT_CONTRACT,
  LIMITE_CENTS,
  deriveSupplierComplianceBars,
  formatSupplierBRL,
  formatSupplierPercent,
} from '../dashboard-summary.view-model.ts'
import {
  page,
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

// Rótulos dos meses (Jan..Dez) — placeholder estático p/ o eixo X do gráfico.
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

export function DashboardPage() {
  const recent = useRecentPayments()

  // Barras de compliance do card "Fornecedores sem Contrato": derivadas (puro) no view-model e já mapeadas
  // para a view burra (nome + status + % bruta p/ a largura + textos formatados). Preview do resumo: até 6.
  const supplierBars: readonly SupplierBar[] = useMemo(
    () =>
      deriveSupplierComplianceBars(SUPPLIERS_WITHOUT_CONTRACT, LIMITE_CENTS).map(
        (b): SupplierBar => ({
          id: b.id,
          name: b.name,
          utilizadoPct: b.utilizadoPct,
          status: b.status,
          percentLabel: formatSupplierPercent(b.utilizadoPct),
          valueLabel: formatSupplierBRL(b.valorTotalCents),
        }),
      ),
    [],
  )

  // Animação de entrada das barras (largura cresce após o mount). SSR-safe: começa false, vira true no client.
  const [animateBars, setAnimateBars] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setAnimateBars(true)
    })
    return () => {
      cancelAnimationFrame(id)
    }
  }, [])

  return (
    <div className={page}>
      <div className={header}>
        <div className={headText}>
          <h1 className={headTitle}>{t('dashboard.title')}</h1>
          <p className={headSubtitle}>{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {/* Linha 1 — 4 cards de métrica (placeholder) */}
      <div className={metricsRow}>
        {METRIC_CARDS.map((m) => (
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
              series={CHART_SERIES}
              yMax={CHART_Y_MAX}
              yTicks={CHART_Y_TICKS}
              months={CHART_MONTHS}
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
              slices={DONUT_SLICES}
              emptyLabel={t('dashboard.cost-center.empty')}
              sliceLabel={(sl) => t(sl.labelKey)}
            />
          </section>

          <SuppliersWithoutContractCard
            title={t('dashboard.suppliers-no-contract.title')}
            seeAllLabel={t('dashboard.suppliers-no-contract.see-all')}
            emptyLabel={t('dashboard.suppliers-no-contract.empty')}
            bars={supplierBars}
            animate={animateBars}
          />
        </div>
      </div>
    </div>
  )
}
