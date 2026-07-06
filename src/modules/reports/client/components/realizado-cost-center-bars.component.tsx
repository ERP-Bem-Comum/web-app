/**
 * RealizadoCostCenterBars — barras horizontais "Por centro de custo" (mock). View BURRA: recebe as fatias já
 * ordenadas (top-N por Planejado, via ViewModel) + o formatador de valor e apresenta uma barra por centro:
 * nome (à direita, ellipsis) + track + fill (azul) + valor. Cores por classe de token (.css.ts). Animação:
 * a largura do fill cresce quando `animate` vira true (SSR-safe: CSS transition).
 */
import type { ReactNode } from 'react'

import {
  hbar,
  hbarName,
  hbarTrack,
  hbarFill,
  hbarFillAnimated,
  hbarValue,
  emptyState,
} from './realizado-charts.css.ts'

export type CostCenterBar = Readonly<{ id: string; label: string; valueCents: number }>

export type RealizadoCostCenterBarsProps = Readonly<{
  bars: readonly CostCenterBar[]
  emptyLabel: string
  animate: boolean
  formatValue: (cents: number) => string
}>

export function RealizadoCostCenterBars(props: RealizadoCostCenterBarsProps): ReactNode {
  const max = props.bars.reduce((m, b) => Math.max(m, b.valueCents), 0)

  if (props.bars.length === 0 || max <= 0) {
    return <p className={emptyState}>{props.emptyLabel}</p>
  }

  return (
    <div>
      {props.bars.map((b) => {
        const widthPct = props.animate ? (b.valueCents / max) * 100 : 0
        return (
          <div key={b.id} className={hbar}>
            <span className={hbarName} title={b.label}>
              {b.label}
            </span>
            <span className={hbarTrack}>
              <span
                className={`${hbarFill} ${props.animate ? hbarFillAnimated : ''}`}
                style={{ inlineSize: `${String(widthPct)}%` }}
              />
            </span>
            <span className={hbarValue}>{props.formatValue(b.valueCents)}</span>
          </div>
        )
      })}
    </div>
  )
}
