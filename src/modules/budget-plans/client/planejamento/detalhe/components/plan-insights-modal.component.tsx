/**
 * PlanInsightsModal — modal de Insights do plano (view BURRA §XI). Apresenta o comparativo do ano atual × anos
 * anteriores JÁ derivado (rótulos + delta + tom) pelo binding/ViewModel. Estados (loading/error/empty/ready)
 * chegam prontos por props; nenhum cálculo aqui.
 */
import type { ReactNode } from 'react'

import type { InsightsState } from '#modules/budget-plans/client/planejamento/detalhe/plan-insights.binding.ts'

import {
  overlay,
  dialog,
  headerRow,
  title,
  subtitle,
  closeButton,
  currentBlock,
  currentLabel,
  currentValue,
  metricsRow,
  metric,
  sourceNote,
  list,
  row,
  rowYear,
  rowTotal,
  delta,
  stateText,
  emptyText,
} from './plan-insights-modal.css.ts'

export type PlanInsightsModalLabels = Readonly<{
  title: string
  subtitle: string
  close: string
  currentTotal: string
  loading: string
  error: string
  empty: string
  history: string
  planned: string
  realized: string
  networksAvg: string
  realizedSource: string
}>

export type PlanInsightsModalProps = Readonly<{
  open: boolean
  state: InsightsState
  labels: PlanInsightsModalLabels
  onClose: () => void
}>

export function PlanInsightsModal(props: PlanInsightsModalProps): ReactNode {
  if (!props.open) return null
  const { state, labels } = props
  return (
    <div className={overlay} role="presentation">
      <div className={dialog} role="dialog" aria-modal="true" aria-label={labels.title}>
        <div className={headerRow}>
          <h3 className={title}>{labels.title}</h3>
          <button type="button" className={closeButton} aria-label={labels.close} onClick={props.onClose}>
            {'×'}
          </button>
        </div>

        {state.status === 'loading' && <p className={stateText}>{labels.loading}</p>}
        {state.status === 'error' && <p className={stateText}>{labels.error}</p>}

        {state.status === 'ready' && (
          <>
            <p className={subtitle}>{labels.subtitle}</p>

            {/* Histórico (§1.6): média do Planejado nos últimos 5 anos anteriores. */}
            <div className={currentBlock}>
              <span className={currentLabel}>{labels.history}</span>
              <span className={currentValue}>{state.view.historyAvgLabel}</span>
            </div>

            {/* Card do ano (§1.6): Planejado · Realizado · Média por rede (#416). */}
            <div className={currentBlock}>
              <span className={currentLabel}>
                {labels.currentTotal} {state.view.currentYear}
              </span>
              <div className={metricsRow}>
                <div className={metric}>
                  <span className={currentLabel}>{labels.planned}</span>
                  <span className={currentValue}>{state.view.currentTotalLabel}</span>
                </div>
                <div className={metric}>
                  <span className={currentLabel}>{labels.realized}</span>
                  <span className={currentValue}>{state.view.realizedLabel}</span>
                </div>
                <div className={metric}>
                  <span className={currentLabel}>
                    {labels.networksAvg} {state.view.networksCountLabel}
                  </span>
                  <span className={currentValue}>{state.view.networksAvgLabel}</span>
                </div>
              </div>
              <p className={sourceNote}>{labels.realizedSource}</p>
            </div>

            {state.view.rows.length === 0 ? (
              <p className={emptyText}>{labels.empty}</p>
            ) : (
              <div className={list}>
                {state.view.rows.map((r) => (
                  <div key={r.year} className={row}>
                    <span className={rowYear}>{r.year}</span>
                    <span className={rowTotal}>{r.totalLabel}</span>
                    <span className={delta[r.deltaTone]}>{r.deltaLabel}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
