/**
 * FluxoCaixaCostCenterBars — gráfico "Agrupado por Centro de Custo" do "Fluxo de Caixa": barras VERTICAIS
 * AGRUPADAS (Previsto × Realizado por Centro de Custo). MOLDE do gráfico "por vencimento" (mesma pele/CSS,
 * `fluxo-caixa-monthly-bars.css.ts`), trocando as séries para Previsto (ciano) × Realizado (verde) e o eixo
 * para os Centros de Custo. View BURRA: recebe as barras já agregadas (ViewModel pura `aggregateByCostCenter`)
 * + o formatador BRL e desenha um PAR de barras por CC (altura proporcional ao máximo global), com legenda no
 * topo e o rótulo do CC abaixo. Cores por CLASSE (a view não importa tokens; §boundaries client-ui ↛ ds-tokens).
 *
 * Hover (padrão do Dashboard): passar o mouse por um grupo mostra um TOOLTIP flutuante (CC + Previsto +
 * Realizado, em BRL). UI-state LOCAL (índice + posição do mouse) — só apresentação; a ViewModel segue pura.
 */
import { useState, type ReactNode } from 'react'

import type { CostCenterMeasure } from '../fluxo-caixa.view-model.ts'
import {
  chartRel,
  tooltip,
  tooltipTitle,
  tooltipRow,
  tooltipName,
  tooltipVal,
  tooltipSwatch,
  emptyState,
  legend,
  legendItem,
  legendSwatch,
  groups,
  group,
  pair,
  barCol,
  barFill,
  barTone,
  swatchTone,
  monthLabel,
} from './fluxo-caixa-monthly-bars.css.ts'

export type FluxoCaixaCostCenterBarsProps = Readonly<{
  bars: readonly CostCenterMeasure[]
  emptyLabel: string
  animate: boolean
  /** Rótulos das séries (i18n). */
  labels: Readonly<{ previsto: string; realizado: string }>
  /** Formatador BRL (cents → "R$ …") passado pela page (formatação não é regra de domínio). */
  formatValue: (cents: number) => string
}>

export function FluxoCaixaCostCenterBars(props: FluxoCaixaCostCenterBarsProps): ReactNode {
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

  if (props.bars.length === 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  const maxValue = Math.max(1, ...props.bars.map((b) => Math.max(b.previstoCents, b.realizadoCents)))
  const active = hover !== null ? props.bars[hover.index] : undefined
  const heightPct = (cents: number): number =>
    props.animate ? Math.max(0, Math.min(100, (cents / maxValue) * 100)) : 0

  return (
    <div
      className={chartRel}
      onMouseLeave={() => {
        setHover(null)
      }}
    >
      <div className={legend}>
        <span className={legendItem}>
          <span className={`${legendSwatch} ${swatchTone.previsto}`} aria-hidden />
          {props.labels.previsto}
        </span>
        <span className={legendItem}>
          <span className={`${legendSwatch} ${swatchTone.realizado}`} aria-hidden />
          {props.labels.realizado}
        </span>
      </div>

      <div className={groups}>
        {props.bars.map((b, i) => (
          <div
            key={b.label}
            className={group}
            onMouseMove={(e) => {
              const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect()
              if (!rect) return
              setHover({ index: i, x: e.clientX - rect.left, y: e.clientY - rect.top })
            }}
          >
            <div className={pair}>
              <span className={barCol}>
                <span
                  className={`${barFill} ${barTone.previsto}`}
                  style={{ blockSize: `${String(heightPct(b.previstoCents))}%` }}
                />
              </span>
              <span className={barCol}>
                <span
                  className={`${barFill} ${barTone.realizado}`}
                  style={{ blockSize: `${String(heightPct(b.realizadoCents))}%` }}
                />
              </span>
            </div>
            <span className={monthLabel} title={b.label}>
              {b.label}
            </span>
          </div>
        ))}
      </div>

      {hover !== null && active !== undefined && (
        <div
          className={tooltip}
          style={{ left: `${String(hover.x)}px`, top: `${String(hover.y)}px` }}
          role="status"
        >
          <div className={tooltipTitle}>{active.label}</div>
          <div className={tooltipRow}>
            <span className={tooltipName}>
              <span className={`${tooltipSwatch} ${swatchTone.previsto}`} aria-hidden />{' '}
              {props.labels.previsto}
            </span>
            <span className={tooltipVal}>{props.formatValue(active.previstoCents)}</span>
          </div>
          <div className={tooltipRow}>
            <span className={tooltipName}>
              <span className={`${tooltipSwatch} ${swatchTone.realizado}`} aria-hidden />{' '}
              {props.labels.realizado}
            </span>
            <span className={tooltipVal}>{props.formatValue(active.realizadoCents)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
